import axios from 'axios';
import MGNREGAData from '../models/MGNREGAData.js';
import CacheMetadata from '../models/CacheMetadata.js';

/**
 * Service to fetch and cache MGNREGA data from data.gov.in
 * Since the actual API structure may vary, this includes fallback mock data generation
 */
class DataService {
  constructor() {
    this.baseURL = process.env.DATA_GOV_BASE_URL || 'https://api.data.gov.in';
    this.apiKey = process.env.DATA_GOV_API_KEY;
    this.cacheExpiryHours = parseInt(process.env.CACHE_EXPIRY_HOURS) || 24;
  }

  /**
   * Fetch data from data.gov.in API
   * Note: This is a template - adjust based on actual API structure
   */
  async fetchFromAPI(endpoint, params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          ...params
        },
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error(`API fetch error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate mock data for demonstration
   * Replace this with actual API integration
   */
  generateMockData(state, district, year, month) {
    const baseMetrics = {
      employmentProvided: Math.floor(Math.random() * 50000) + 10000,
      householdsWorked: Math.floor(Math.random() * 30000) + 5000,
      totalPersonDays: Math.floor(Math.random() * 500000) + 100000,
      womenPersonDays: Math.floor(Math.random() * 250000) + 50000,
      scPersonDays: Math.floor(Math.random() * 100000) + 20000,
      stPersonDays: Math.floor(Math.random() * 80000) + 15000,
      worksCompleted: Math.floor(Math.random() * 5000) + 1000,
      worksInProgress: Math.floor(Math.random() * 3000) + 500,
      totalExpenditure: Math.floor(Math.random() * 500000000) + 100000000,
      wageExpenditure: Math.floor(Math.random() * 300000000) + 60000000,
      materialExpenditure: Math.floor(Math.random() * 200000000) + 40000000,
      totalJobCards: Math.floor(Math.random() * 50000) + 10000,
      activeJobCards: Math.floor(Math.random() * 30000) + 5000,
      avgDaysPerHousehold: parseFloat((Math.random() * 50 + 30).toFixed(2)),
      avgWageRate: parseFloat((Math.random() * 50 + 200).toFixed(2))
    };

    return baseMetrics;
  }

  /**
   * Get or create cached data for a district
   */
  async getDistrictData(state, district, year = new Date().getFullYear(), month = 'All') {
    try {
      // First try to find data from imported CSV (using financial_year)
      let cachedData = await MGNREGAData.findOne({
        state: state.toUpperCase(),
        district: district.toUpperCase(),
        month: 'All'
      }).sort({ lastUpdated: -1 }); // Get most recent

      if (cachedData) {
        console.log(`✅ Found imported data for ${district}, ${state}`);
        console.log(`   Person-Days: ${cachedData.total_persondays_generated?.toLocaleString()}`);
        console.log(`   Expenditure: ₹${(cachedData.total_expenditure / 10000000).toFixed(2)} Cr`);
        return cachedData;
      }

      // Fallback: Check with year and month (for old structure)
      cachedData = await MGNREGAData.findOne({
        state,
        district,
        year,
        month
      });

      if (cachedData && this.isCacheValid(cachedData.lastUpdated)) {
        console.log(`✅ Cache hit for ${district}, ${state}`);
        return cachedData;
      }

      // Cache miss or expired - fetch new data
      console.log(`⚠️ No data found for ${district}, ${state} - generating mock data`);
      return await this.refreshDistrictData(state, district, year, month);
    } catch (error) {
      console.error(`Error getting district data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refresh data for a specific district
   */
  async refreshDistrictData(state, district, year, month) {
    try {
      // Try to fetch from actual API
      let metrics;
      try {
        // TODO: Replace with actual API call
        // const apiData = await this.fetchFromAPI('/mgnrega/data', { state, district, year });
        // metrics = this.parseAPIResponse(apiData);
        
        // For now, use mock data
        metrics = this.generateMockData(state, district, year, month);
      } catch (apiError) {
        console.warn('API unavailable, using mock data:', apiError.message);
        metrics = this.generateMockData(state, district, year, month);
      }

      // Update or create database entry
      const data = await MGNREGAData.findOneAndUpdate(
        { state, district, year, month },
        {
          state,
          stateCode: this.getStateCode(state),
          district,
          districtCode: this.getDistrictCode(district),
          month,
          year,
          financialYear: this.getFinancialYear(year, month),
          metrics,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      // Update cache metadata
      await this.updateCacheMetadata(`${state}-${district}-${year}-${month}`, 'success');

      return data;
    } catch (error) {
      await this.updateCacheMetadata(`${state}-${district}-${year}-${month}`, 'error', error.message);
      throw error;
    }
  }

  /**
   * Get historical data for trend analysis
   */
  async getHistoricalData(state, district, months = 12) {
    // Fetch latest records grouped by month (handle both uppercase and original case)
    const data = await MGNREGAData.find({
      $or: [
        { state: state, district: district },
        { state: state.toUpperCase(), district: district.toUpperCase() }
      ]
    })
    .sort({ financial_year: -1, month: 1 })
    .limit(months)
    .lean();

    // Transform to ensure consistent structure
    return data.map(record => ({
      ...record,
      year: record.year || record.financial_year?.split('-')[0] || '2024',
      month: record.month || 'All',
      metrics: {
        employmentProvided: record.total_households_worked || 0,
        householdsWorked: record.total_households_worked || 0,
        totalPersonDays: record.total_persondays_generated || 0,
        womenPersonDays: record.total_women_persondays || 0,
        scPersonDays: record.sc_persondays || 0,
        stPersonDays: record.st_persondays || 0,
        totalExpenditure: record.total_expenditure || 0,
        wageExpenditure: record.wage_expenditure || 0,
        materialExpenditure: record.material_expenditure || 0,
        worksCompleted: record.total_completed_works || 0,
        worksInProgress: record.total_ongoing_works || 0
      }
    }));
  }

  /**
   * Get state-level aggregated data
   */
  async getStateData(state, year = new Date().getFullYear()) {
    const data = await MGNREGAData.aggregate([
      {
        $match: { state, year }
      },
      {
        $group: {
          _id: '$state',
          totalEmployment: { $sum: '$metrics.employmentProvided' },
          totalHouseholds: { $sum: '$metrics.householdsWorked' },
          totalPersonDays: { $sum: '$metrics.totalPersonDays' },
          totalExpenditure: { $sum: '$metrics.totalExpenditure' },
          districtsCount: { $sum: 1 }
        }
      }
    ]);

    return data[0] || null;
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid(lastUpdated) {
    const expiryTime = this.cacheExpiryHours * 60 * 60 * 1000;
    return (Date.now() - new Date(lastUpdated).getTime()) < expiryTime;
  }

  /**
   * Update cache metadata
   */
  async updateCacheMetadata(key, status, errorMessage = null) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.cacheExpiryHours);

    await CacheMetadata.findOneAndUpdate(
      { key },
      {
        key,
        lastFetched: new Date(),
        expiresAt,
        status,
        errorMessage
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Helper: Get financial year from month and year
   */
  getFinancialYear(year, month) {
    // Indian financial year: April to March
    const monthNum = this.getMonthNumber(month);
    if (monthNum >= 4) {
      return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
  }

  /**
   * Helper: Convert month name to number
   */
  getMonthNumber(monthName) {
    const months = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12,
      'All': 0
    };
    return months[monthName] || 0;
  }

  /**
   * Placeholder for state code lookup
   */
  getStateCode(state) {
    // TODO: Implement proper state code lookup
    return state.substring(0, 2).toUpperCase();
  }

  /**
   * Placeholder for district code lookup
   */
  getDistrictCode(district) {
    // TODO: Implement proper district code lookup
    return district.substring(0, 4).toUpperCase();
  }

  /**
   * Bulk refresh for all cached data
   */
  async refreshAllData() {
    try {
      const allData = await MGNREGAData.find({});
      console.log(`🔄 Refreshing ${allData.length} cached records...`);

      let successCount = 0;
      let errorCount = 0;

      for (const record of allData) {
        try {
          await this.refreshDistrictData(
            record.state,
            record.district,
            record.year,
            record.month
          );
          successCount++;
        } catch (error) {
          console.error(`Error refreshing ${record.state}/${record.district}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ Refresh complete: ${successCount} success, ${errorCount} errors`);
      return { successCount, errorCount };
    } catch (error) {
      console.error('Bulk refresh error:', error);
      throw error;
    }
  }
}

export default new DataService();
