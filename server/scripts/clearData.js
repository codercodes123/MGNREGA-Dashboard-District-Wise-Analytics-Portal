import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MGNREGAData from '../models/MGNREGAData.js';
import CacheMetadata from '../models/CacheMetadata.js';

dotenv.config();

/**
 * Script to clear all data from database
 * Usage: node scripts/clearData.js
 */

const clearData = async () => {
  try {
    console.log('🧹 Starting database cleanup...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count existing records
    const dataCount = await MGNREGAData.countDocuments();
    const cacheCount = await CacheMetadata.countDocuments();
    
    console.log(`📊 Found ${dataCount} data records`);
    console.log(`📊 Found ${cacheCount} cache metadata records`);

    // Confirm deletion
    console.log('\n⚠️  This will delete all data from the database!');
    
    // Delete all data
    await MGNREGAData.deleteMany({});
    console.log('✅ Cleared MGNREGA data');
    
    await CacheMetadata.deleteMany({});
    console.log('✅ Cleared cache metadata');
    
    console.log('\n✨ Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run cleanup
clearData();
