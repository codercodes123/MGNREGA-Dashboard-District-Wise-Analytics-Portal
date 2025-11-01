import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Simple logging for debugging
    if (response.data && response.data.source) {
      console.log(`✅ Live data fetched from ${response.data.sourceDetail || 'API'}`);
    }
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('❌ API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// API methods
export const apiService = {
  // Health check
  healthCheck: async () => {
    try {
      return await api.get('/health');
    } catch (error) {
      throw error;
    }
  },

  // Get all states
  getStates: async () => {
    try {
      return await api.get('/states');
    } catch (error) {
      throw error;
    }
  },

  // Get districts by state
  getDistricts: async (state) => {
    try {
      return await api.get(`/districts/${encodeURIComponent(state)}`);
    } catch (error) {
      throw error;
    }
  },

  // Get district data
  getDistrictData: async (state, district, params = {}) => {
    try {
      return await api.get(`/data/${encodeURIComponent(state)}/${encodeURIComponent(district)}`, {
        params
      });
    } catch (error) {
      throw error;
    }
  },

  // Get historical data
  getHistoricalData: async (state, district, months = 12) => {
    try {
      return await api.get(
        `/data/${encodeURIComponent(state)}/${encodeURIComponent(district)}/history`,
        { params: { months } }
      );
    } catch (error) {
      throw error;
    }
  },

  // Get state summary
  getStateSummary: async (state, year) => {
    try {
      return await api.get(`/state/${encodeURIComponent(state)}/summary`, {
        params: { year }
      });
    } catch (error) {
      throw error;
    }
  },

  // Search
  search: async (query) => {
    try {
      return await api.get('/search', {
        params: { query }
      });
    } catch (error) {
      throw error;
    }
  },

  // Compare districts
  compareDistricts: async (districts, year) => {
    try {
      return await api.get('/compare', {
        params: { districts, year }
      });
    } catch (error) {
      throw error;
    }
  },

  // Refresh data
  refreshData: async (state, district, year, month) => {
    try {
      return await api.post('/refresh', {
        state,
        district,
        year,
        month
      });
    } catch (error) {
      throw error;
    }
  }
};

export default api;
