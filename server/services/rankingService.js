import MGNREGAData from '../models/MGNREGAData.js';

/**
 * Service for calculating district rankings within states
 */
class RankingService {
  /**
   * Calculate district rank based on performance metrics
   * @param {string} state - State name
   * @param {string} district - District name
   * @returns {Promise<Object>} Ranking information
   */
  async getDistrictRank(state, district) {
    try {
      // Get the latest year for this state
      const latestData = await MGNREGAData.findOne({ 
        state: new RegExp(`^${state}$`, 'i')
      }).sort({ year: -1 });
      
      if (!latestData) {
        return {
          error: 'No data found for this state',
          rank: null,
          totalDistricts: 0
        };
      }
      
      const targetYear = latestData.year;
      
      // Aggregate district-level performance for the latest year
      const districtPerformance = await MGNREGAData.aggregate([
        {
          $match: {
            state: new RegExp(`^${state}$`, 'i'),
            year: targetYear
          }
        },
        {
          $group: {
            _id: '$district',
            totalPersonDays: { $sum: '$metrics.totalPersonDays' },
            totalExpenditure: { $sum: '$metrics.totalExpenditure' },
            totalEmployment: { $sum: '$metrics.employmentProvided' },
            totalHouseholds: { $sum: '$metrics.householdsWorked' },
            avgWageRate: { $avg: '$metrics.avgWageRate' }
          }
        },
        {
          $addFields: {
            // Composite score: weighted combination of metrics
            performanceScore: {
              $add: [
                { $multiply: ['$totalPersonDays', 0.4] },
                { $multiply: ['$totalExpenditure', 0.0001] }, // Scale down expenditure
                { $multiply: ['$totalEmployment', 0.3] },
                { $multiply: ['$totalHouseholds', 0.3] }
              ]
            }
          }
        },
        {
          $sort: { performanceScore: -1 }
        }
      ]);
      
      if (districtPerformance.length === 0) {
        return {
          error: 'No performance data available',
          rank: null,
          totalDistricts: 0
        };
      }
      
      // Find the rank of the target district
      const districtIndex = districtPerformance.findIndex(
        d => d._id.toLowerCase() === district.toLowerCase()
      );
      
      if (districtIndex === -1) {
        return {
          error: 'District not found in rankings',
          rank: null,
          totalDistricts: districtPerformance.length
        };
      }
      
      const rank = districtIndex + 1;
      const districtData = districtPerformance[districtIndex];
      
      // Get top and bottom performers for context
      const topPerformers = districtPerformance.slice(0, 3).map((d, i) => ({
        rank: i + 1,
        district: d._id,
        performanceScore: d.performanceScore.toFixed(2)
      }));
      
      return {
        rank,
        totalDistricts: districtPerformance.length,
        state,
        district,
        year: targetYear,
        performanceScore: districtData.performanceScore.toFixed(2),
        metrics: {
          totalPersonDays: districtData.totalPersonDays,
          totalExpenditure: districtData.totalExpenditure,
          totalEmployment: districtData.totalEmployment,
          totalHouseholds: districtData.totalHouseholds,
          avgWageRate: districtData.avgWageRate
        },
        topPerformers,
        percentile: ((districtPerformance.length - rank + 1) / districtPerformance.length * 100).toFixed(1)
      };
    } catch (error) {
      console.error('Error calculating district rank:', error);
      throw new Error('Failed to calculate district rank');
    }
  }
  
  /**
   * Get state-level rankings for all districts
   * @param {string} state - State name
   * @returns {Promise<Array>} List of districts with rankings
   */
  async getStateRankings(state) {
    try {
      // Get the latest year for this state
      const latestData = await MGNREGAData.findOne({ 
        state: new RegExp(`^${state}$`, 'i')
      }).sort({ year: -1 });
      
      if (!latestData) {
        return [];
      }
      
      const targetYear = latestData.year;
      
      // Aggregate district-level performance
      const rankings = await MGNREGAData.aggregate([
        {
          $match: {
            state: new RegExp(`^${state}$`, 'i'),
            year: targetYear
          }
        },
        {
          $group: {
            _id: '$district',
            totalPersonDays: { $sum: '$metrics.totalPersonDays' },
            totalExpenditure: { $sum: '$metrics.totalExpenditure' },
            totalEmployment: { $sum: '$metrics.employmentProvided' },
            totalHouseholds: { $sum: '$metrics.householdsWorked' }
          }
        },
        {
          $addFields: {
            performanceScore: {
              $add: [
                { $multiply: ['$totalPersonDays', 0.4] },
                { $multiply: ['$totalExpenditure', 0.0001] },
                { $multiply: ['$totalEmployment', 0.3] },
                { $multiply: ['$totalHouseholds', 0.3] }
              ]
            }
          }
        },
        {
          $sort: { performanceScore: -1 }
        }
      ]);
      
      return rankings.map((item, index) => ({
        rank: index + 1,
        district: item._id,
        performanceScore: item.performanceScore.toFixed(2),
        metrics: {
          totalPersonDays: item.totalPersonDays,
          totalExpenditure: item.totalExpenditure,
          totalEmployment: item.totalEmployment,
          totalHouseholds: item.totalHouseholds
        }
      }));
    } catch (error) {
      console.error('Error fetching state rankings:', error);
      throw new Error('Failed to fetch state rankings');
    }
  }
}

export default new RankingService();
