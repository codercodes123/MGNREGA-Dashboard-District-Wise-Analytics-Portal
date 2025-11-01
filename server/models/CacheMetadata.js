import mongoose from 'mongoose';

const cacheMetadataSchema = new mongoose.Schema({
  key: {
    type: String,
    index: true
  },
  district: {
    type: String,
    index: true
  },
  state: {
    type: String,
    index: true
  },
  lastFetched: {
    type: Date,
    default: Date.now
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  lastApiSuccess: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['success', 'error', 'pending'],
    default: 'pending'
  },
  apiStatus: {
    type: String,
    enum: ['success', 'error', 'pending'],
    default: 'pending'
  },
  errorMessage: {
    type: String
  },
  recordCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  strict: false
});

const CacheMetadata = mongoose.model('CacheMetadata', cacheMetadataSchema);

export default CacheMetadata;
