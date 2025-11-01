import express from 'express';
import dataService from '../services/dataService.js';
import liveAPIService from '../services/liveAPIService.js';
import rankingService from '../services/rankingService.js';
import maharashtraLeaderboard from '../services/maharashtraLeaderboard.js';
import { getLiveDistrict, isInMaharashtra } from '../services/multiApiGeolocation.js';
import { indianStates, sampleDistricts } from '../config/states.js';
import MGNREGAData from '../models/MGNREGAData.js';
import Feedback from '../models/Feedback.js';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/states
 * Get list of all states
 */
router.get('/states', async (req, res) => {
  try {
    res.json({
      success: true,
      data: indianStates,
      count: indianStates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch states',
      message: error.message
    });
  }
});

/**
 * GET /api/districts/:state
 * Get districts for a specific state
 */
router.get('/districts/:state', async (req, res) => {
  try {
    const { state } = req.params;
    
    // First, try to get districts from cached data
    const cachedDistricts = await MGNREGAData.distinct('district', { state });
    
    if (cachedDistricts.length > 0) {
      const districts = cachedDistricts.map(district => ({
        name: district,
        code: district.substring(0, 4).toUpperCase()
      }));
      
      return res.json({
        success: true,
        data: districts,
        count: districts.length,
        source: 'cache'
      });
    }
    
    // Fallback to sample districts
    const sampleData = sampleDistricts[state] || [];
    res.json({
      success: true,
      data: sampleData,
      count: sampleData.length,
      source: 'sample'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch districts',
      message: error.message
    });
  }
});

/**
 * GET /api/data/:state/:district
 * Get MGNREGA data (MongoDB first, API as fallback)
 */
router.get('/data/:state/:district', async (req, res) => {
  try {
    const { state, district } = req.params;
    const { year, month } = req.query;
    
    const currentYear = year ? parseInt(year) : null;
    const currentMonth = month || 'All';
    
    // Fetch data (liveAPIService checks MongoDB first, then API)
    const result = await liveAPIService.fetchLiveData(
      district,
      state,
      currentYear,
      currentMonth
    );
    
    console.log(`✅ Fetched dashboard data for ${district} from ${result.source}`);
    
    res.json({
      success: true,
      data: result.data,
      source: result.source,
      sourceDetail: result.sourceDetail || result.source,
      fresh: result.fresh || false,
      timestamp: result.timestamp,
      lastUpdated: result.lastUpdated
    });
    
  } catch (error) {
    console.log(`❌ Failed fetching ${req.params.district}: ${error.message}`);
    
    // Return 404 instead of 500 for missing data
    res.status(404).json({
      success: false,
      error: 'Data not available',
      message: `No data found for ${req.params.district}, ${req.params.state}`,
      source: 'none'
    });
  }
});

/**
 * GET /api/data/:state/:district/history
 * Get historical data for trend analysis
 */
router.get('/data/:state/:district/history', async (req, res) => {
  try {
    const { state, district } = req.params;
    const { months = 12 } = req.query;
    
    const data = await dataService.getHistoricalData(state, district, parseInt(months));
    
    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical data',
      message: error.message
    });
  }
});

/**
 * GET /api/state/:state/summary
 * Get state-level summary
 */
router.get('/state/:state/summary', async (req, res) => {
  try {
    const { state } = req.params;
    const { year } = req.query;
    
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const data = await dataService.getStateData(state, currentYear);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch state summary',
      message: error.message
    });
  }
});

/**
 * POST /api/refresh
 * Manually trigger data refresh for a district
 */
router.post('/refresh', async (req, res) => {
  try {
    const { state, district, year, month } = req.body;
    
    if (!state || !district) {
      return res.status(400).json({
        success: false,
        error: 'State and district are required'
      });
    }
    
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || 'All';
    
    const data = await dataService.refreshDistrictData(state, district, currentYear, currentMonth);
    
    res.json({
      success: true,
      message: 'Data refreshed successfully',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh data',
      message: error.message
    });
  }
});

/**
 * GET /api/compare
 * Compare multiple districts
 */
router.get('/compare', async (req, res) => {
  try {
    const { districts, year } = req.query;
    
    if (!districts) {
      return res.status(400).json({
        success: false,
        error: 'Districts parameter is required'
      });
    }
    
    const districtList = districts.split(',');
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const comparisonData = await Promise.all(
      districtList.map(async (districtInfo) => {
        const [state, district] = districtInfo.split(':');
        return await dataService.getDistrictData(state, district, currentYear);
      })
    );
    
    res.json({
      success: true,
      data: comparisonData,
      count: comparisonData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to compare districts',
      message: error.message
    });
  }
});

/**
 * GET /api/search
 * Search for districts by name
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters'
      });
    }
    
    const results = await MGNREGAData.find({
      $or: [
        { district: { $regex: query, $options: 'i' } },
        { state: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/rank
 * Get district ranking within its state
 */
router.get('/rank', async (req, res) => {
  try {
    const { state, district } = req.query;
    
    if (!state || !district) {
      return res.status(400).json({
        success: false,
        error: 'State and district parameters are required'
      });
    }
    
    const rankData = await rankingService.getDistrictRank(state, district);
    
    res.json({
      success: true,
      data: rankData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get district rank',
      message: error.message
    });
  }
});

/**
 * GET /api/rankings/:state
 * Get all district rankings for a state
 */
router.get('/rankings/:state', async (req, res) => {
  try {
    const { state } = req.params;
    
    const rankings = await rankingService.getStateRankings(state);
    
    res.json({
      success: true,
      data: rankings,
      count: rankings.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get state rankings',
      message: error.message
    });
  }
});

/**
 * GET /api/location-check
 * Check if a location exists in the database with fuzzy matching
 */
router.get('/location-check', async (req, res) => {
  try {
    const { state, district } = req.query;
    
    if (!state || !district) {
      return res.status(400).json({
        success: false,
        error: 'State and district parameters are required'
      });
    }
    
    // Normalize input
    const normalizeStr = (str) => str.toLowerCase().trim()
      .replace(/\s+district$/i, '')
      .replace(/\s+city$/i, '')
      .replace(/\s+taluk$/i, '');
    
    const normalizedDistrict = normalizeStr(district);
    const normalizedState = normalizeStr(state);
    
    // Try exact match first (case-insensitive)
    let exists = await MGNREGAData.findOne({
      state: new RegExp(`^${state}$`, 'i'),
      district: new RegExp(`^${district}$`, 'i')
    });
    
    if (exists) {
      return res.json({
        success: true,
        exists: true,
        state: exists.state,
        district: exists.district,
        matchType: 'exact'
      });
    }
    
    // Try partial match on district name within the same state
    exists = await MGNREGAData.findOne({
      state: new RegExp(`^${state}$`, 'i'),
      district: new RegExp(normalizedDistrict, 'i')
    });
    
    if (exists) {
      return res.json({
        success: true,
        exists: true,
        state: exists.state,
        district: exists.district,
        matchType: 'partial'
      });
    }
    
    // Try broader fuzzy matching
    const allDistrictsInState = await MGNREGAData.find({
      state: new RegExp(`^${state}$`, 'i')
    }).distinct('district');
    
    // Simple similarity check
    const calculateSimilarity = (str1, str2) => {
      const s1 = normalizeStr(str1);
      const s2 = normalizeStr(str2);
      
      // Check if one contains the other
      if (s1.includes(s2) || s2.includes(s1)) {
        return 0.9;
      }
      
      // Check word overlap
      const words1 = s1.split(/\s+/);
      const words2 = s2.split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w)).length;
      const totalWords = Math.max(words1.length, words2.length);
      
      return totalWords > 0 ? commonWords / totalWords : 0;
    };
    
    // Find best match
    let bestMatch = null;
    let bestScore = 0;
    
    for (const districtName of allDistrictsInState) {
      const score = calculateSimilarity(normalizedDistrict, districtName);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = districtName;
      }
    }
    
    // Accept match if similarity > 0.6
    if (bestMatch && bestScore >= 0.6) {
      const matchedDoc = await MGNREGAData.findOne({
        state: new RegExp(`^${state}$`, 'i'),
        district: new RegExp(`^${bestMatch}$`, 'i')
      });
      
      if (matchedDoc) {
        return res.json({
          success: true,
          exists: true,
          state: matchedDoc.state,
          district: matchedDoc.district,
          matchType: 'fuzzy',
          similarity: bestScore.toFixed(2)
        });
      }
    }
    
    // No good match found - return suggestions
    const closeMatches = await MGNREGAData.find({
      $or: [
        { state: new RegExp(state, 'i') },
        { district: new RegExp(district, 'i') }
      ]
    }).limit(10);
    
    // Deduplicate suggestions
    const uniqueSuggestions = [];
    const seen = new Set();
    
    for (const match of closeMatches) {
      const key = `${match.state}|${match.district}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSuggestions.push({
          state: match.state,
          district: match.district
        });
      }
    }
    
    res.json({
      success: true,
      exists: false,
      suggestions: uniqueSuggestions.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check location',
      message: error.message
    });
  }
});

/**
 * GET /api/leaderboard
 * Main leaderboard endpoint - returns Maharashtra district rankings
 * (Replaces old state leaderboard)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboardData = await maharashtraLeaderboard.getMaharashtraLeaderboard();
    res.json({
      success: true,
      type: 'districts',
      state: 'Maharashtra',
      ...leaderboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

/**
 * GET /api/maharashtra/leaderboard
 * Get complete Maharashtra district leaderboard
 */
router.get('/maharashtra/leaderboard', async (req, res) => {
  try {
    const leaderboardData = await maharashtraLeaderboard.getMaharashtraLeaderboard();
    res.json(leaderboardData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Maharashtra leaderboard',
      message: error.message
    });
  }
});

/**
 * GET /api/maharashtra/top/:limit
 * Get top N districts in Maharashtra
 */
router.get('/maharashtra/top/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const topDistricts = await maharashtraLeaderboard.getTopDistricts(limit);
    res.json({
      success: true,
      count: topDistricts.length,
      data: topDistricts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top districts',
      message: error.message
    });
  }
});

/**
 * GET /api/maharashtra/district-rank/:district
 * Get rank and details for a specific district
 */
router.get('/maharashtra/district-rank/:district', async (req, res) => {
  try {
    const districtName = req.params.district;
    const districtData = await maharashtraLeaderboard.getDistrictRank(districtName);
    
    if (!districtData) {
      return res.status(404).json({
        success: false,
        error: 'District not found'
      });
    }
    
    res.json({
      success: true,
      data: districtData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch district rank',
      message: error.message
    });
  }
});

/**
 * GET /api/maharashtra/category/:category
 * Get districts by performance category
 */
router.get('/maharashtra/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const districts = await maharashtraLeaderboard.getDistrictsByCategory(category);
    res.json({
      success: true,
      category: category,
      count: districts.length,
      data: districts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch districts by category',
      message: error.message
    });
  }
});

/**
 * POST /api/geolocation
 * Reverse geocode coordinates to get district and state
 * Body: { latitude, longitude }
 */
router.post('/geolocation', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate input
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing coordinates',
        message: 'Both latitude and longitude are required'
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude',
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid longitude',
        message: 'Longitude must be between -180 and 180'
      });
    }

    console.log(`📍 Geolocation request: ${latitude}, ${longitude}`);

    // Get location info using multi-API fallback chain
    // Priority: MapmyIndia → Geoapify → LocationIQ
    const locationInfo = await getLiveDistrict(latitude, longitude);

    // Check if in Maharashtra
    const inMaharashtra = isInMaharashtra(locationInfo);
    const warning = !inMaharashtra ? 
      'Location is outside Maharashtra. Only Maharashtra districts are supported.' : 
      null;

    res.json({
      success: true,
      location: {
        state: locationInfo.state,
        district: locationInfo.district,
        city: locationInfo.city,
        country: locationInfo.country,
        formatted: locationInfo.formatted,
        coordinates: locationInfo.coordinates,
        accuracy: locationInfo.accuracy,
        source: locationInfo.source, // Which API was used
        warning: warning
      }
    });

  } catch (error) {
    console.error('❌ Geolocation API error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Geolocation failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/feedback
 * Submit user feedback
 * Body: { name, district, message, language }
 */
router.post('/feedback', async (req, res) => {
  try {
    const { name, district, message, language } = req.body;

    // Validate required fields
    if (!name || !district || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, district, and message are required'
      });
    }

    // Create feedback document
    const feedback = new Feedback({
      name: name.trim(),
      district: district.trim(),
      message: message.trim(),
      language: language || 'en',
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    });

    await feedback.save();

    console.log(`✅ Feedback received from ${name} (${district})`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id
    });

  } catch (error) {
    console.error('❌ Feedback submission error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
      message: error.message
    });
  }
});

/**
 * GET /api/feedback
 * Get all feedback (admin only - add auth later)
 */
router.get('/feedback', async (req, res) => {
  try {
    const { district, status, limit = 50 } = req.query;

    const query = {};
    if (district) query.district = district;
    if (status) query.status = status;

    const feedback = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: feedback.length,
      feedback
    });

  } catch (error) {
    console.error('❌ Feedback fetch error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback',
      message: error.message
    });
  }
});

export default router;
