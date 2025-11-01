/**
 * District Name Translation Utility
 * Converts district names to the selected language
 */

/**
 * Get translated district name
 * @param {string} districtName - District name in English uppercase
 * @param {Function} t - Translation function from useTranslation hook
 * @returns {string} Translated district name or original if not found
 */
export const getDistrictName = (districtName, t) => {
  if (!districtName) return '';
  
  // Try to get translation from districts key
  const translatedName = t(`districts.${districtName}`, districtName);
  
  // If translation is same as key, return formatted original
  if (translatedName === districtName) {
    return formatDistrictName(districtName);
  }
  
  return translatedName;
};

/**
 * Format district name to title case
 * @param {string} districtName - District name in uppercase
 * @returns {string} Formatted district name
 */
export const formatDistrictName = (districtName) => {
  if (!districtName) return '';
  
  // Convert to title case
  return districtName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Translate list of districts
 * @param {Array} districts - Array of district names
 * @param {Function} t - Translation function
 * @returns {Array} Array of translated district names
 */
export const translateDistricts = (districts, t) => {
  if (!Array.isArray(districts)) return [];
  return districts.map(district => getDistrictName(district, t));
};

export default {
  getDistrictName,
  formatDistrictName,
  translateDistricts
};
