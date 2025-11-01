import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import apiRoutes from './routes/api.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { initCronJobs } from './jobs/cronJobs.js';
import csvDataService from './services/csvDataService.js';
import leaderboardService from './services/leaderboardService.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Load CSV into memory at startup
csvDataService.loadFromFile().catch((err) => {
  console.error('Failed to load initial CSV:', err?.message || err);
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Response compression
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'MGNREGA District Performance API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: '/api/health',
      states: '/api/states',
      districts: '/api/districts/:state',
      districtData: '/api/data/:state/:district',
      history: '/api/data/:state/:district/history',
      stateSummary: '/api/state/:state/summary',
      refresh: '/api/refresh (POST)',
      compare: '/api/compare',
      search: '/api/search',
      mgnregaCsv: '/api/mgnrega',
      leaderboard: '/api/leaderboard',
      rank: '/api/rank?state=<state>&district=<district>'
    }
  });
});

app.use('/api', apiRoutes);

// Get all unique states from CSV (filtered to top 5 only)
app.get('/api/states', (req, res) => {
  try {
    const TOP_5_STATES = [
      'Uttar Pradesh',
      'Maharashtra',
      'Bihar',
      'West Bengal',
      'Madhya Pradesh'
    ];
    
    const allStates = csvDataService.getStates();
    
    // Filter to only include top 5 states (case-insensitive)
    const filteredStates = allStates.filter(state => 
      TOP_5_STATES.some(top5 => state.name.toLowerCase() === top5.toLowerCase())
    );
    
    res.json({
      success: true,
      count: filteredStates.length,
      data: filteredStates
    });
  } catch (err) {
    console.error('Error in /api/states:', err.message);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// Get districts for a specific state from CSV
app.get('/api/districts', (req, res) => {
  try {
    const { state } = req.query;
    
    if (!state) {
      return res.status(400).json({ error: 'State parameter is required' });
    }
    
    const districts = csvDataService.getDistricts(state);
    res.json({
      success: true,
      state,
      count: districts.length,
      data: districts
    });
  } catch (err) {
    console.error('Error in /api/districts:', err.message);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// Check if location exists in CSV data
app.get('/api/location-check', (req, res) => {
  try {
    const { state, district } = req.query;
    
    if (!state || !district) {
      return res.status(400).json({ 
        error: 'Both state and district parameters are required' 
      });
    }
    
    const exists = csvDataService.locationExists(state, district);
    res.json({
      success: true,
      exists,
      state,
      district
    });
  } catch (err) {
    console.error('Error in /api/location-check:', err.message);
    res.status(500).json({ error: 'Failed to check location' });
  }
});

// CSV-backed endpoint
app.get('/api/mgnrega', (req, res) => {
  try {
    const { state, district } = req.query;
    const data = csvDataService.filter({ state, district });
    const { lastLoadedAt } = csvDataService.meta();
    res.json({
      count: data.length,
      lastLoadedAt,
      data
    });
  } catch (err) {
    console.error('Error in /api/mgnrega:', err.message);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Leaderboard endpoint - top performing states
app.get('/api/leaderboard', (req, res) => {
  try {
    const leaderboard = leaderboardService.getLeaderboard();
    res.json({
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (err) {
    console.error('Error in /api/leaderboard:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// District rank endpoint
app.get('/api/rank', (req, res) => {
  try {
    const { state, district } = req.query;
    
    if (!state || !district) {
      return res.status(400).json({ 
        error: 'Both state and district parameters are required' 
      });
    }

    const rankData = leaderboardService.getDistrictRank(state, district);
    
    if (rankData.error) {
      return res.status(404).json(rankData);
    }

    res.json(rankData);
  } catch (err) {
    console.error('Error in /api/rank:', err.message);
    res.status(500).json({ error: 'Failed to fetch rank' });
  }
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🚀 MGNREGA API Server Running              ║
  ║   (LIVE API MODE - data.gov.in)              ║
  ║                                               ║
  ║   📍 Port: ${PORT}                           ║
  ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║   🔗 URL: http://localhost:${PORT}           ║
  ║   📡 Data Source: data.gov.in API (Live)     ║
  ║   💾 MongoDB: Sync only (no fallbacks)       ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
  
  // Initialize cron jobs (run in all environments)
  initCronJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});
