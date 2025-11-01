/**
 * Geolocation utility for auto-detecting user location
 */

/**
 * Get user's current position
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Normalize state names to match database entries
 */
const normalizeStateName = (stateName) => {
  if (!stateName) return null;
  
  const stateMap = {
    'uttar pradesh': 'Uttar Pradesh',
    'up': 'Uttar Pradesh',
    'maharashtra': 'Maharashtra',
    'mh': 'Maharashtra',
    'bihar': 'Bihar',
    'br': 'Bihar',
    'west bengal': 'West Bengal',
    'wb': 'West Bengal',
    'madhya pradesh': 'Madhya Pradesh',
    'mp': 'Madhya Pradesh',
    'gujarat': 'Gujarat',
    'gj': 'Gujarat',
    'delhi': 'Delhi (NCT)',
    'nct of delhi': 'Delhi (NCT)',
    'national capital territory of delhi': 'Delhi (NCT)',
    'karnataka': 'Karnataka',
    'ka': 'Karnataka',
    'tamil nadu': 'Tamil Nadu',
    'tn': 'Tamil Nadu',
    'rajasthan': 'Rajasthan',
    'rj': 'Rajasthan'
  };
  
  const normalized = stateName.toLowerCase().trim();
  return stateMap[normalized] || stateName;
};

/**
 * Normalize district names to match database entries
 */
const normalizeDistrictName = (districtName) => {
  if (!districtName) return null;
  
  // Remove common suffixes
  let normalized = districtName.trim()
    .replace(/\s+district$/i, '')
    .replace(/\s+taluk$/i, '')
    .replace(/\s+tehsil$/i, '');
  
  // Capitalize first letter of each word
  return normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Reverse geocode coordinates to get location information
 * Uses Google Maps Geocoding API via backend for accurate Maharashtra district detection
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const apiUrl = 'https://mgnrega-dashboard-district-wise.onrender.com/api';
    
    console.log('🌍 Calling backend geolocation API...');
    
    // Call our backend API which uses Google Maps
    const response = await fetch(`${apiUrl}/geolocation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude,
        longitude
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Geolocation request failed');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Geolocation failed');
    }
    
    const location = data.location;
    
    console.log('✅ Location detected:', {
      state: location.state,
      district: location.district,
      city: location.city,
      formatted: location.formatted
    });
    
    // Check if location is in Maharashtra
    if (location.state !== 'Maharashtra') {
      console.warn('⚠️  User location is outside Maharashtra:', location.state);
      throw new Error(`This dashboard currently supports Maharashtra only. Detected location: ${location.state}`);
    }
    
    // Return normalized format
    return {
      state: location.state,
      district: location.district,
      city: location.city,
      country: location.country,
      formatted: location.formatted,
      confidence: location.accuracy === 'ROOFTOP' ? 10 : location.accuracy === 'RANGE_INTERPOLATED' ? 8 : 5,
      coordinates: location.coordinates,
      warning: location.warning
    };
    
  } catch (error) {
    console.error('❌ Google Maps geocoding error:', error);
    
    // Fallback to Nominatim for basic location info
    console.log('⚠️  Falling back to OpenStreetMap Nominatim...');
    return reverseGeocodeNominatim(latitude, longitude);
  }
};

/**
 * Fallback reverse geocoding using OpenStreetMap Nominatim
 */
const reverseGeocodeNominatim = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'MGNREGA-Dashboard/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Nominatim geocoding failed');
    }
    
    const data = await response.json();
    
    const rawState = data.address?.state || data.address?.region || null;
    const rawDistrict = 
      data.address?.county || 
      data.address?.state_district || 
      data.address?.district ||
      data.address?.city ||
      data.address?.town ||
      null;
    
    const state = normalizeStateName(rawState);
    const district = normalizeDistrictName(rawDistrict);
    
    return {
      state,
      district,
      city: data.address?.city || data.address?.town || data.address?.village || null,
      country: data.address?.country || null,
      formatted: data.display_name,
      confidence: 5, // Default confidence for Nominatim
      raw: {
        state: rawState,
        district: rawDistrict
      }
    };
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    throw new Error('Unable to determine location from coordinates');
  }
};

/**
 * Get user's location with district information
 */
export const getUserLocation = async () => {
  try {
    const position = await getCurrentPosition();
    const locationInfo = await reverseGeocode(position.latitude, position.longitude);
    
    return {
      ...position,
      ...locationInfo
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Check if geolocation is available
 */
export const isGeolocationAvailable = () => {
  return 'geolocation' in navigator;
};
