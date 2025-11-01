import MGNREGAData from '../models/MGNREGAData.js';

/**
 * Maharashtra District Leaderboard Service
 * Ranks all 35 districts based on MGNREGA performance
 */

/**
 * Calculate performance score for a district using normalized values
 * Uses: 60% Person-Days + 40% Expenditure
 * Normalization prevents overflow and ensures fair comparison
 */
function calculatePerformanceScore(districtData, maxPersonDays, maxExpenditure) {
  if (!districtData || !districtData.metrics) {
    return 0;
  }

  const metrics = districtData.metrics;
  
  // Normalize to 0-1 scale using actual max values from dataset
  const normalizedPersonDays = maxPersonDays > 0 
    ? (metrics.totalPersonDays || 0) / maxPersonDays 
    : 0;
    
  const normalizedExpenditure = maxExpenditure > 0 
    ? (metrics.totalExpenditure || 0) / maxExpenditure 
    : 0;
  
  // Combined score (0-100 scale)
  const overallScore = (normalizedPersonDays * 0.6 + normalizedExpenditure * 0.4) * 100;
  
  return Math.round(overallScore * 100) / 100;
}

/**
 * Get performance category based on score (with Marathi labels)
 * Thresholds: 80 (Excellent), 60 (Good), 40 (Average), <40 (Needs Improvement)
 */
function getPerformanceCategory(score) {
  if (score >= 80) return { 
    label: '🟢 उत्कृष्ट', // Excellent
    labelEn: 'Excellent',
    color: 'green', 
    icon: '🟢', 
    emoji: '🌟' 
  };
  if (score >= 60) return { 
    label: '🟡 चांगले', // Good
    labelEn: 'Good',
    color: 'yellow', 
    icon: '🟡', 
    emoji: '✅' 
  };
  if (score >= 40) return { 
    label: '🟠 सरासरी', // Average
    labelEn: 'Average',
    color: 'orange', 
    icon: '🟠', 
    emoji: '⚡' 
  };
  return { 
    label: '🔴 सुधारणा आवश्यक', // Needs Improvement
    labelEn: 'Needs Improvement',
    color: 'red', 
    icon: '🔴', 
    emoji: '⚠️' 
  };
}

/**
 * Get latest data for all Maharashtra districts
 */
export async function getMaharashtraLeaderboard() {
  try {
    // Get latest year
    const latestRecord = await MGNREGAData.findOne({ state: 'Maharashtra' })
      .sort({ year: -1, month: -1 })
      .limit(1);
    
    if (!latestRecord) {
      return {
        success: false,
        message: 'No data found for Maharashtra',
        leaderboard: []
      };
    }
    
    const latestYear = latestRecord.year;
    
    // Get all districts for latest year
    const districts = await MGNREGAData.find({
      state: 'Maharashtra',
      year: latestYear
    });
    
    // Aggregate metrics by district
    const districtMap = new Map();
    
    districts.forEach(record => {
      const district = record.district;
      
      if (!districtMap.has(district)) {
        districtMap.set(district, {
          district: district,
          totalPersonDays: 0,
          totalExpenditure: 0,
          employmentProvided: 0,
          householdsWorked: 0,
          worksCompleted: 0,
          worksInProgress: 0,
          avgWageRate: 0,
          monthsCount: 0
        });
      }
      
      const districtData = districtMap.get(district);
      
      // Use root-level fields from imported CSV data
      districtData.totalPersonDays += record.total_persondays_generated || 0;
      districtData.totalExpenditure += record.total_expenditure || 0;
      districtData.employmentProvided += record.average_days_per_household || 0;
      districtData.householdsWorked = Math.max(districtData.householdsWorked, record.total_households_worked || 0);
      districtData.worksCompleted += record.total_completed_works || 0;
      districtData.worksInProgress += record.total_ongoing_works || 0;
      districtData.avgWageRate += record.average_wage_per_day || 0;
      districtData.monthsCount++;
    });
    
    // Calculate average wage rate
    districtMap.forEach((data) => {
      data.avgWageRate = data.monthsCount > 0 
        ? Math.round(data.avgWageRate / data.monthsCount) 
        : 0;
    });
    
    // Find max values for normalization
    const allData = Array.from(districtMap.values());
    const maxPersonDays = Math.max(...allData.map(d => d.totalPersonDays || 0), 1);
    const maxExpenditure = Math.max(...allData.map(d => d.totalExpenditure || 0), 1);
    
    // Calculate scores and rank using normalized values
    const leaderboard = allData.map(data => {
      const score = calculatePerformanceScore({ metrics: data }, maxPersonDays, maxExpenditure);
      const category = getPerformanceCategory(score);
      
      return {
        rank: 0, // Will be set after sorting
        district: data.district,
        score: score,
        employment: data.totalPersonDays,
        works: data.worksCompleted,
        category: category.label,
        categoryColor: category.color,
        icon: category.icon,
        emoji: category.emoji,
        metrics: {
          totalPersonDays: data.totalPersonDays,
          totalExpenditure: data.totalExpenditure,
          employmentProvided: data.employmentProvided,
          householdsWorked: data.householdsWorked,
          worksCompleted: data.worksCompleted,
          worksInProgress: data.worksInProgress,
          completionRate: data.worksCompleted + data.worksInProgress > 0
            ? Math.round((data.worksCompleted / (data.worksCompleted + data.worksInProgress)) * 100)
            : 0,
          avgWageRate: data.avgWageRate
        }
      };
    });
    
    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Add ranks
    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
      
      // Add rank emoji
      if (item.rank === 1) item.rankEmoji = '🥇';
      else if (item.rank === 2) item.rankEmoji = '🥈';
      else if (item.rank === 3) item.rankEmoji = '🥉';
      else if (item.rank <= 10) item.rankEmoji = '🏆';
      else item.rankEmoji = '📍';
    });
    
    console.log(`✅ Leaderboard generated: ${leaderboard.length} districts`);
    
    return {
      success: true,
      year: latestYear,
      totalDistricts: leaderboard.length,
      leaderboard: leaderboard
    };
    
  } catch (error) {
    console.error('Error generating Maharashtra leaderboard:', error);
    throw error;
  }
}

/**
 * Get rank for a specific district
 */
export async function getDistrictRank(districtName) {
  try {
    const leaderboardData = await getMaharashtraLeaderboard();
    
    if (!leaderboardData.success) {
      return null;
    }
    
    const district = leaderboardData.leaderboard.find(
      d => d.district.toLowerCase() === districtName.toLowerCase()
    );
    
    return district || null;
    
  } catch (error) {
    console.error('Error getting district rank:', error);
    throw error;
  }
}

/**
 * Get top N performing districts
 */
export async function getTopDistricts(limit = 10) {
  try {
    const leaderboardData = await getMaharashtraLeaderboard();
    
    if (!leaderboardData.success) {
      return [];
    }
    
    return leaderboardData.leaderboard.slice(0, limit);
    
  } catch (error) {
    console.error('Error getting top districts:', error);
    throw error;
  }
}

/**
 * Get districts by performance category
 */
export async function getDistrictsByCategory(category) {
  try {
    const leaderboardData = await getMaharashtraLeaderboard();
    
    if (!leaderboardData.success) {
      return [];
    }
    
    return leaderboardData.leaderboard.filter(
      d => d.category.toLowerCase() === category.toLowerCase()
    );
    
  } catch (error) {
    console.error('Error getting districts by category:', error);
    throw error;
  }
}

export default {
  getMaharashtraLeaderboard,
  getDistrictRank,
  getTopDistricts,
  getDistrictsByCategory
};
