/**
 * Format large numbers with Indian numbering system
 */
export const formatIndianNumber = (num) => {
  if (!num && num !== 0) return '-';
  
  const numStr = num.toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  return lastThree;
};

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (!amount && amount !== 0) return '-';
  
  const symbol = showSymbol ? '₹' : '';
  
  if (amount >= 10000000) {
    return `${symbol}${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `${symbol}${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(2)} K`;
  }
  
  return `${symbol}${formatIndianNumber(amount)}`;
};

/**
 * Format date
 */
export const formatDate = (date, locale = 'en-IN') => {
  if (!date) return '-';
  
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format relative time
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(date);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (!value && value !== 0) return '-';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

/**
 * Abbreviate large numbers with language support
 */
export const abbreviateNumber = (num, language = 'en') => {
  if (!num && num !== 0) return '-';
  
  // Unit labels by language
  const units = {
    en: { crore: 'Cr', lakh: 'L', thousand: 'K' },
    hi: { crore: 'करोड़', lakh: 'लाख', thousand: 'हज़ार' },
    mr: { crore: 'कोटी', lakh: 'लाख', thousand: 'हजार' }
  };
  
  const lang = units[language] || units.en;
  
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(1)}${lang.crore}`;
  } else if (num >= 100000) {
    return `${(num / 100000).toFixed(1)}${lang.lakh}`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}${lang.thousand}`;
  }
  
  return num.toString();
};

/**
 * Abbreviate number with current i18n language
 */
export const abbreviateNumberI18n = (num) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const language = localStorage.getItem('i18nextLng') || 'en';
    return abbreviateNumber(num, language);
  }
  return abbreviateNumber(num, 'en');
};

/**
 * Get color based on performance
 */
export const getPerformanceColor = (value, threshold = { good: 80, average: 50 }) => {
  if (value >= threshold.good) return 'text-success-600 bg-success-50';
  if (value >= threshold.average) return 'text-warning-600 bg-warning-50';
  return 'text-primary-600 bg-primary-50';
};

/**
 * Get trend icon and color
 */
export const getTrendInfo = (percentageChange) => {
  if (!percentageChange && percentageChange !== 0) {
    return { icon: 'minus', color: 'text-gray-500', text: 'No change' };
  }
  
  if (percentageChange > 0) {
    return { icon: 'trending-up', color: 'text-success-600', text: 'Increase' };
  } else if (percentageChange < 0) {
    return { icon: 'trending-down', color: 'text-primary-600', text: 'Decrease' };
  }
  
  return { icon: 'minus', color: 'text-gray-500', text: 'No change' };
};
