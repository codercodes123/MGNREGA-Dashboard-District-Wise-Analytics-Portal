/**
 * Maharashtra-Only MGNREGA Dashboard
 * Focused on all 35 districts of Maharashtra
 */
export const MAHARASHTRA_ONLY = ['Maharashtra'];

export const indianStates = [
  { 
    code: '27', 
    name: 'Maharashtra', 
    nameHindi: 'महाराष्ट्र',
    nameMarathi: 'महाराष्ट्र',
    totalDistricts: 35
  }
];

/**
 * Sample districts for demonstration
 * In production, these should be fetched from API
 */
export const sampleDistricts = {
  'Uttar Pradesh': [
    { code: '3401', name: 'Agra', nameHindi: 'आगरा' },
    { code: '3402', name: 'Aligarh', nameHindi: 'अलीगढ़' },
    { code: '3403', name: 'Allahabad', nameHindi: 'प्रयागराज' },
    { code: '3404', name: 'Lucknow', nameHindi: 'लखनऊ' },
    { code: '3405', name: 'Varanasi', nameHindi: 'वाराणसी' }
  ],
  'Bihar': [
    { code: '0501', name: 'Patna', nameHindi: 'पटना' },
    { code: '0502', name: 'Gaya', nameHindi: 'गया' },
    { code: '0503', name: 'Bhagalpur', nameHindi: 'भागलपुर' },
    { code: '0504', name: 'Muzaffarpur', nameHindi: 'मुजफ्फरपुर' }
  ],
  'Maharashtra': [
    { code: '2101', name: 'Mumbai', nameHindi: 'मुंबई' },
    { code: '2102', name: 'Pune', nameHindi: 'पुणे' },
    { code: '2103', name: 'Nagpur', nameHindi: 'नागपुर' },
    { code: '2104', name: 'Aurangabad', nameHindi: 'औरंगाबाद' }
  ]
};
