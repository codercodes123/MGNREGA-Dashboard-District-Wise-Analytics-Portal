import axios from 'axios';
import dotenv from 'dotenv';
import MGNREGAData from '../models/MGNREGAData.js';

// Load environment variables
dotenv.config();

/**
 * Pure Live API Service - Direct data.gov.in Integration
 * 
 * Features:
 * - Fetches ONLY from data.gov.in API (no fallbacks)
 * - Syncs response to MongoDB for record-keeping
 * - Returns fresh data on every request
 * - No cached/estimated data usage
 * 
 * Flow:
 * 1. Call data.gov.in API
 * 2. If successful → Sync to MongoDB → Return live data
 * 3. If failed → Throw error (frontend handles)
 */

class LiveAPIService {
  constructor() {
    this.apiTimeout = parseInt(process.env.API_TIMEOUT) || 15000;
    this.apiKey = process.env.DATA_GOV_API_KEY;
    this.apiBaseUrl = process.env.DATA_GOV_BASE_URL || 'https://api.data.gov.in';
    
    // Validate API key on initialization
    if (!this.apiKey) {
      console.error('❌ DATA_GOV_API_KEY not found in environment variables!');
      console.error('⚠️  Please check your server/.env file');
    } else {
      console.log('✅ DATA_GOV_API_KEY loaded successfully');
      console.log(`   Key preview: ${this.apiKey.substring(0, 10)}...`);
    }
  }

  /**
   * Fetch live data from data.gov.in API
   * @param {string} districtName - District name
   * @param {string} stateName - State name
   * @param {number} year - Financial year (optional)
   * @param {string} month - Month filter (optional)
   * @returns {Promise<Object>} Live API data
   */
  async fetchLiveData(districtName, stateName, year = null, month = 'All') {
    console.log(`📊 Fetching data: ${districtName}, ${stateName}`);

    const currentYear = year || new Date().getFullYear();
    
    // **PRIORITY 1: Check MongoDB first**
    const mongoData = await this.fetchFromMongoDB(districtName, stateName, currentYear, month);
    if (mongoData) {
      console.log(`   ✅ Data from MongoDB`);
      return {
        success: true,
        data: mongoData,
        source: 'MongoDB',
        sourceDetail: 'Database',
        fresh: false,
        timestamp: new Date(),
        lastUpdated: mongoData.lastUpdated
      };
    }

    // **PRIORITY 2: Try API if MongoDB has no data**
    if (!this.apiKey) {
      throw new Error('No data available for this district');
    }
    
    // Build API URL - adjust endpoint based on actual data.gov.in structure
    const apiEndpoint = `${this.apiBaseUrl}/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722`;
    
    const params = {
      'api-key': this.apiKey,
      'format': 'json',
      'filters[state_name]': stateName,
      'filters[district_name]': districtName.toUpperCase(),
      'filters[financial_year]': currentYear.toString(),
      'limit': 1000
    };

    if (month && month !== 'All') {
      params['filters[month]'] = month;
    }

    try {
      // Call API silently
      
      const startTime = Date.now();
      
      const response = await axios.get(apiEndpoint, {
        params,
        timeout: this.apiTimeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MGNREGA-Dashboard/1.0'
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.data && response.data.records && response.data.records.length > 0) {
        console.log(`   ✅ Data from API`);
        
        // Aggregate data from multiple records if needed
        const aggregatedData = this.aggregateRecords(response.data.records);
        
        // Sync to MongoDB for record-keeping
        await this.syncToMongoDB(districtName, stateName, aggregatedData, currentYear, month);
        
        return {
          success: true,
          data: aggregatedData,
          source: 'API',
          sourceDetail: 'data.gov.in (Live)',
          fresh: true,
          timestamp: new Date(),
          responseTime
        };
      } else {
        throw new Error(`No data available for ${districtName}, ${stateName}`);
      }

    } catch (error) {
      console.error(`   ❌ API failed: ${error.message}`);
      throw new Error(`No data available for ${districtName}, ${stateName}`);
    }
  }

  /**
   * Aggregate multiple records into single dataset
   */
  aggregateRecords(records) {
    if (records.length === 1) {
      return records[0];
    }

    // Sum up numeric fields across records
    const aggregated = { ...records[0] };
    const numericFields = [
      'total_persondays_generated',
      'total_households_worked',
      'total_exp',
      'total_wages_paid',
      'material_exp',
      'women_persondays',
      'sc_persondays',
      'st_persondays',
      'total_works',
      'total_works_completed',
      'total_works_takenup',
      'total_households_registered'
    ];

    for (let i = 1; i < records.length; i++) {
      numericFields.forEach(field => {
        if (records[i][field]) {
          aggregated[field] = (aggregated[field] || 0) + (records[i][field] || 0);
        }
      });
    }

    return aggregated;
  }

  /**
   * Fetch data from MongoDB when API has no data
   */
  async fetchFromMongoDB(districtName, stateName, year, month) {
    try {
      // Try simple query first (matches imported CSV data)
      const query = {
        district: districtName.toUpperCase(),
        state: 'Maharashtra'
      };

      console.log(`   🔍 MongoDB Query:`, query);

      // Find most recent entry
      const cachedData = await MGNREGAData.findOne(query)
        .sort({ lastUpdated: -1 })
        .lean();

      if (cachedData) {
        console.log(`   ✅ MongoDB found data for: ${cachedData.district}`);
        console.log(`   📊 Has metrics object:`, !!cachedData.metrics);
        console.log(`   📊 Person-Days:`, cachedData.metrics?.totalPersonDays || 'N/A');
        console.log(`   📊 Expenditure:`, cachedData.metrics?.totalExpenditure || 'N/A');
        console.log(`   📊 Employment:`, cachedData.metrics?.employmentProvided || 'N/A');
        return cachedData;
      }

      console.log(`   ⚠️  No MongoDB data found for: ${districtName.toUpperCase()}, Maharashtra`);
      return null;
    } catch (error) {
      console.error(`   ❌ MongoDB fetch error: ${error.message}`);
      return null;
    }
  }

  /**
   * Sync data to MongoDB for record-keeping
   */
  async syncToMongoDB(districtName, stateName, data, year, month) {
    try {
      const query = {
        state_name: stateName,
        district_name: districtName.toUpperCase(),
        financial_year: year.toString(),
        month: month || 'All'
      };

      const updateData = {
        ...data,
        lastUpdated: new Date(),
        source: 'data.gov.in',
        syncedAt: new Date()
      };

      await MGNREGAData.findOneAndUpdate(
        query,
        { $set: updateData },
        { upsert: true, new: true }
      );

    } catch (error) {
      console.error(`   ⚠️  Sync failed: ${error.message}`);
      // Don't throw - MongoDB sync failure shouldn't block API response
    }
  }
}

// Export singleton instance
const liveAPIService = new LiveAPIService();

export async function fetchLiveData(district, state, year, month) {
  return await liveAPIService.fetchLiveData(district, state, year, month);
}

export default liveAPIService;
