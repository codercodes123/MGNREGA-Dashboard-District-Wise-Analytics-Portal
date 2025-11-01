/**
 * Maharashtra-Only District Leaderboard Service
 * All leaderboard operations now return Maharashtra district rankings
 */
import maharashtraLeaderboard from './maharashtraLeaderboard.js';

/**
 * Get complete Maharashtra district leaderboard
 * Replaces old state leaderboard - now returns districts
 */
export const getLeaderboard = async () => {
  try {
    const result = await maharashtraLeaderboard.getMaharashtraLeaderboard();
    return result.success ? result.leaderboard : [];
  } catch (error) {
    console.error('Error getting Maharashtra leaderboard:', error);
    return [];
  }
};

/**
 * Get district rank (Maharashtra-only)
 */
export const getDistrictRank = async (state, district) => {
  try {
    // Maharashtra-only, so we ignore state parameter
    const districtName = district || state; // Handle both parameters
    return await maharashtraLeaderboard.getDistrictRank(districtName);
  } catch (error) {
    console.error('Error getting district rank:', error);
    return { error: 'Failed to get district rank' };
  }
};

/**
 * Get top N districts
 */
export const getTopDistricts = async (limit = 10) => {
  try {
    return await maharashtraLeaderboard.getTopDistricts(limit);
  } catch (error) {
    console.error('Error getting top districts:', error);
    return [];
  }
};

/**
 * Get districts by performance category
 */
export const getDistrictsByCategory = async (category) => {
  try {
    return await maharashtraLeaderboard.getDistrictsByCategory(category);
  } catch (error) {
    console.error('Error getting districts by category:', error);
    return [];
  }
};

// Default export
export default {
  getLeaderboard,
  getDistrictRank,
  getTopDistricts,
  getDistrictsByCategory
};
