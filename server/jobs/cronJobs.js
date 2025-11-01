import cron from 'node-cron';
import liveAPIService from '../services/liveAPIService.js';
import MGNREGAData from '../models/MGNREGAData.js';
import CacheMetadata from '../models/CacheMetadata.js';

/**
 * Initialize cron jobs for periodic tasks
 * Includes: cache cleanup, periodic data refresh
 */
export const initCronJobs = () => {
  console.log('🕐 Initializing cron jobs...');

  /**
   * Periodic data refresh: Every 6 hours (keeps cache fresh)
   * Runs at 2 AM, 8 AM, 2 PM, 8 PM IST
   */
  cron.schedule('0 2,8,14,20 * * *', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 PERIODIC DATA REFRESH - Starting...');
    console.log('='.repeat(80));
    console.log(`🕐 Time: ${new Date().toISOString()}`);
    
    try {
      // Get list of districts that need refresh (cache older than 12 hours)
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      
      const districtsToRefresh = await CacheMetadata.find({
        lastUpdated: { $lt: twelveHoursAgo }
      }).limit(20); // Refresh max 20 districts per cycle to avoid API limits

      console.log(`📋 Found ${districtsToRefresh.length} districts needing refresh`);

      if (districtsToRefresh.length === 0) {
        console.log('✅ All districts are up to date');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const meta of districtsToRefresh) {
        try {
          console.log(`\n   🔄 Refreshing: ${meta.district}, ${meta.state}`);
          
          const result = await liveAPIService.fetchLiveData(meta.district, meta.state);
          
          if (result.source === 'API') {
            successCount++;
            console.log(`   ✅ Refreshed from API`);
          }

          // Small delay to avoid hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          failCount++;
          console.error(`   ❌ Failed to refresh ${meta.district}: ${error.message}`);
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log(`📊 REFRESH SUMMARY:`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
      console.log(`   📈 Total processed: ${districtsToRefresh.length}`);
      console.log('='.repeat(80) + '\n');

    } catch (error) {
      console.error('❌ Periodic refresh failed:', error.message);
      console.log('='.repeat(80) + '\n');
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  /**
   * Cache cleanup every Sunday at 3:00 AM
   * Removes data older than 90 days
   */
  cron.schedule('0 3 * * 0', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🧹 CACHE CLEANUP - Starting...');
    console.log('='.repeat(80));
    
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      // Remove very old data
      const deleteResult = await MGNREGAData.deleteMany({
        lastUpdated: { $lt: ninetyDaysAgo }
      });

      console.log(`✅ Deleted ${deleteResult.deletedCount} old records`);

      // Clean up orphaned cache metadata
      const metaDeleteResult = await CacheMetadata.deleteMany({
        lastUpdated: { $lt: ninetyDaysAgo }
      });

      console.log(`✅ Deleted ${metaDeleteResult.deletedCount} old cache metadata entries`);
      console.log('✅ Cache cleanup complete');
      console.log('='.repeat(80) + '\n');

    } catch (error) {
      console.error('❌ Cache cleanup failed:', error.message);
      console.log('='.repeat(80) + '\n');
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('✅ Cron jobs initialized:');
  console.log('   🔄 Data refresh: Every 6 hours (2 AM, 8 AM, 2 PM, 8 PM IST)');
  console.log('   🧹 Cache cleanup: Every Sunday at 3 AM IST');
  console.log('');
};
