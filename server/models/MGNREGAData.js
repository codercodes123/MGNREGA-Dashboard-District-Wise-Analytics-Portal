import mongoose from 'mongoose';

const mgnregaDataSchema = new mongoose.Schema({
  // Support both formats: state/district and state_name/district_name
  state: {
    type: String,
    index: true
  },
  state_name: {
    type: String,
    index: true
  },
  stateCode: {
    type: String
  },
  district: {
    type: String,
    index: true
  },
  district_name: {
    type: String,
    index: true
  },
  districtCode: {
    type: String
  },
  month: {
    type: String
  },
  year: {
    type: Number,
    index: true
  },
  financialYear: {
    type: String
  },
  financial_year: {
    type: String,
    index: true
  },
  
  // Flat API fields (from data.gov.in)
  total_persondays_generated: Number,
  total_households_worked: Number,
  total_exp: Number,
  total_wages_paid: Number,
  material_exp: Number,
  women_persondays: Number,
  sc_persondays: Number,
  st_persondays: Number,
  total_works: Number,
  total_works_completed: Number,
  total_works_takenup: Number,
  total_households_registered: Number,
  metrics: {
    // Employment Metrics
    employmentProvided: {
      type: Number,
      default: 0
    },
    householdsWorked: {
      type: Number,
      default: 0
    },
    totalPersonDays: {
      type: Number,
      default: 0
    },
    womenPersonDays: {
      type: Number,
      default: 0
    },
    scPersonDays: {
      type: Number,
      default: 0
    },
    stPersonDays: {
      type: Number,
      default: 0
    },
    
    // Work Completion Metrics
    worksCompleted: {
      type: Number,
      default: 0
    },
    worksInProgress: {
      type: Number,
      default: 0
    },
    
    // Financial Metrics
    totalExpenditure: {
      type: Number,
      default: 0
    },
    wageExpenditure: {
      type: Number,
      default: 0
    },
    materialExpenditure: {
      type: Number,
      default: 0
    },
    
    // Job Card Metrics
    totalJobCards: {
      type: Number,
      default: 0
    },
    activeJobCards: {
      type: Number,
      default: 0
    },
    
    // Average Metrics
    avgDaysPerHousehold: {
      type: Number,
      default: 0
    },
    avgWageRate: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  dataSource: {
    type: String,
    default: 'data.gov.in'
  },
  source: {
    type: String,
    enum: ['data.gov.in', 'API', 'MongoDB', 'Fallback'],
    default: 'data.gov.in'
  },
  isFallback: {
    type: Boolean,
    default: false
  },
  apiVersion: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true,
  strict: false // Allow flexible schema for API data
});

// Compound indexes for efficient queries (support both formats)
mgnregaDataSchema.index({ state: 1, district: 1, year: 1, month: 1 });
mgnregaDataSchema.index({ state_name: 1, district_name: 1, financial_year: 1 });

// Index for time-based queries
mgnregaDataSchema.index({ lastUpdated: -1 });

const MGNREGAData = mongoose.model('MGNREGAData', mgnregaDataSchema);

export default MGNREGAData;
