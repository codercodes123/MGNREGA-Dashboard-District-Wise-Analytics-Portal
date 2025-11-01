/**
 * Fuzzy matching utilities for better location matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * Lower distance = more similar
 */
export const levenshteinDistance = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const matrix = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[s2.length][s1.length];
};

/**
 * Calculate similarity score (0-1, where 1 is exact match)
 */
export const similarityScore = (str1, str2) => {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
};

/**
 * Find best match from a list of candidates
 * Returns the best match if similarity > threshold, otherwise null
 */
export const findBestMatch = (query, candidates, threshold = 0.6) => {
  if (!query || !candidates || candidates.length === 0) {
    return null;
  }
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const candidate of candidates) {
    const score = similarityScore(query, candidate);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  // Only return if score exceeds threshold
  if (bestScore >= threshold) {
    return {
      match: bestMatch,
      score: bestScore,
      confidence: bestScore >= 0.9 ? 'high' : bestScore >= 0.75 ? 'medium' : 'low'
    };
  }
  
  return null;
};

/**
 * Check if two strings are similar enough to be considered a match
 */
export const isSimilar = (str1, str2, threshold = 0.8) => {
  const score = similarityScore(str1, str2);
  return score >= threshold;
};

/**
 * Normalize a location name for matching
 */
export const normalizeLocationName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+district$/i, '')
    .replace(/\s+city$/i, '')
    .replace(/\s+taluk$/i, '')
    .replace(/\s+tehsil$/i, '')
    .replace(/\s+division$/i, '')
    .replace(/\s+/g, ' ');
};
