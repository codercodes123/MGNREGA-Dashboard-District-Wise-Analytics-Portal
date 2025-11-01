import mongoose from 'mongoose';
import csv from 'csvtojson';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MGNREGAData from '../models/MGNREGAData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_PATH = path.resolve(__dirname, '..', 'models', 'maharashtra1.csv');

async function importData() {
  try {
    console.log('🌾 Importing Maharashtra Data...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mgnrega');
    console.log('✅ Connected to MongoDB\n');
    
    // Clear existing data
    console.log('🗑️  Clearing old data...');
    await MGNREGAData.deleteMany({});
    console.log('✅ Cleared\n');
    
    // Read CSV
    console.log('📂 Reading CSV...');
    const records = await csv().fromFile(CSV_PATH);
    console.log(`✅ Found ${records.length} records\n`);
    
    // Process and group by district/year/month to avoid duplicates
    console.log('💾 Processing records...');
    const recordMap = new Map();
    
    for (const rec of records) {
      const district = (rec.district_name || '').toString().trim().toUpperCase();
      if (!district) continue;
      
      const finYear = rec.fin_year || '2024-2025';
      const year = parseInt(finYear.split('-')[0]);
      const month = rec.month || 'Jan';
      const key = `${district}_${year}_${month}`;
      
      // Keep only the first occurrence of each district/year/month
      if (!recordMap.has(key)) {
        const totalIndividuals = parseInt(rec.Total_Individuals_Worked || 0);
        const avgDays = parseFloat(rec.Average_days_of_employment_provided_per_Household || 0);
        
        recordMap.set(key, {
          state: 'Maharashtra',
          stateCode: '27',
          district,
          districtCode: rec.district_code,
          year,
          month,
          financialYear: finYear,
          metrics: {
            totalPersonDays: Math.round(totalIndividuals * avgDays),
            totalExpenditure: parseFloat(rec.Total_Exp || 0),
            employmentProvided: totalIndividuals,
            householdsWorked: parseInt(rec.Total_Households_Worked || 0),
            avgWageRate: parseFloat(rec.Average_Wage_rate_per_day_per_person || 0),
            worksCompleted: parseInt(rec.Number_of_Completed_Works || 0),
            worksInProgress: parseInt(rec.Number_of_Ongoing_Works || 0),
            womenPersonDays: parseInt(rec.Women_Persondays || 0),
            activeJobCards: parseInt(rec.Total_No_of_Active_Job_Cards || 0)
          },
          lastUpdated: new Date()
        });
      }
    }
    
    const batch = Array.from(recordMap.values());
    console.log(`📊 Unique records: ${batch.length}`);
    
    console.log('💾 Inserting into MongoDB...');
    await MGNREGAData.insertMany(batch, { ordered: false });
    console.log(`✅ Inserted ${batch.length} records\n`);
    
    // Calculate and update ranks
    console.log('🏆 Calculating ranks...');
    const districts = await MGNREGAData.aggregate([
      { $group: {
        _id: '$district',
        totalPersonDays: { $sum: '$metrics.totalPersonDays' },
        totalExpenditure: { $sum: '$metrics.totalExpenditure' },
        worksCompleted: { $sum: '$metrics.worksCompleted' },
        worksInProgress: { $sum: '$metrics.worksInProgress' }
      }}
    ]);
    
    // Score each district
    const scored = districts.map(d => {
      const empScore = Math.min(100, (d.totalPersonDays / 50000) * 40);
      const compRate = d.worksCompleted + d.worksInProgress > 0 
        ? (d.worksCompleted / (d.worksCompleted + d.worksInProgress)) * 30 
        : 0;
      const expScore = Math.min(100, (d.totalExpenditure / 10000000) * 30);
      return {
        district: d._id,
        score: empScore + compRate + expScore
      };
    }).sort((a, b) => b.score - a.score);
    
    // Assign ranks
    for (let i = 0; i < scored.length; i++) {
      const rank = i + 1;
      const badge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
      await MGNREGAData.updateMany(
        { district: scored[i].district },
        { $set: { rank, performanceScore: scored[i].score, rankBadge: badge }}
      );
    }
    
    console.log(`✅ Ranks assigned to ${scored.length} districts\n`);
    
    // Display results
    const unique = await MGNREGAData.distinct('district');
    console.log(`📊 Total: ${await MGNREGAData.countDocuments()} records`);
    console.log(`📍 Districts: ${unique.length}`);
    console.log(`\n🏆 Top 10:`);
    scored.slice(0, 10).forEach((d, i) => {
      const badge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      console.log(`   ${badge} #${i+1} ${d.district} - Score: ${d.score.toFixed(1)}`);
    });
    
    console.log('\n✅ Complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

importData();
