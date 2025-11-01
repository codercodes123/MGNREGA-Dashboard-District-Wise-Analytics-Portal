import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Multi-API Geolocation Service for Maximum Accuracy in Indian District Detection
 * Fallback Chain: Google → MapmyIndia → Geoapify → LocationIQ
 * 
 * Free Tier Limits:
 * - Google: 40,000 requests/month (most accurate globally)
 * - MapmyIndia: 2,500 requests/day (accurate for India)
 * - Geoapify: 3,000 requests/day (global coverage)
 * - LocationIQ: 5,000 requests/day (last resort)
 */

const GOOGLE_API_KEY = process.env.GOOGLE_GEOCODING_API_KEY;
const MAPMYINDIA_API_KEY = process.env.MAPMYINDIA_API_KEY;
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

/** Maharashtra district corrections and variations */
const MAHARASHTRA_DISTRICT_MAP = {
  // Official name changes
  AURANGABAD: "CHATRAPATI SAMBHAJI NAGAR",
  OSMANABAD: "DHARASHIV",
  
  // Spelling variations
  AHMADNAGAR: "AHMEDNAGAR",
  AHMEDNAGAR: "AHMEDNAGAR",
  BULDANA: "BULDHANA",
  GONDIYA: "GONDIA",
  
  // Alternative spellings
  "CHATRAPATI SAMBHAJINAGAR": "CHATRAPATI SAMBHAJI NAGAR",
  "CHHATRAPATI SAMBHAJI NAGAR": "CHATRAPATI SAMBHAJI NAGAR",
  "SAMBHAJI NAGAR": "CHATRAPATI SAMBHAJI NAGAR",
  
  // Taluka to District mappings
  "KARVIR": "KOLHAPUR",
  "ROHA TALUKA": "RAIGAD",
  "ROHA": "RAIGAD",
  "NAGPUR URBAN TALUKA": "NAGPUR",
  "NAGPUR URBAN": "NAGPUR",
  "NANDGAON-KHANDESHWAR": "AKOLA",
  "AKOLA TALUKA": "AKOLA",
  "PUNE CITY TALUKA": "PUNE",
  "HAVELI TALUKA": "PUNE",
  "MUMBAI CITY TALUKA": "MUMBAI SUBURBAN",
  "MUMBAI SUBURBAN TALUKA": "MUMBAI SUBURBAN",
  
  // City names that match districts
  "MUMBAI": "MUMBAI SUBURBAN",
  "MUMBAI CITY": "MUMBAI SUBURBAN",
  "GREATER MUMBAI": "MUMBAI SUBURBAN",
  "THANE": "THANE",
  "PUNE": "PUNE",
  "NAGPUR": "NAGPUR",
  "NASHIK": "NASHIK",
  "AKOLA": "AKOLA",
  "AMRAVATI": "AMRAVATI",
  "SOLAPUR": "SOLAPUR",
  "KOLHAPUR": "KOLHAPUR",
  "RAIGAD": "RAIGAD",
  "RATNAGIRI": "RATNAGIRI",
  "SINDHUDURG": "SINDHUDURG",
};

/** Normalize district name */
const normalizeDistrictName = (district) => {
  if (!district) return null;
  let normalized = district.trim().toUpperCase()
    .replace(/\s+DISTRICT$/i, "")
    .replace(/\s+TALUK$/i, "")
    .replace(/\s+TALUKA$/i, "")
    .replace(/\s+TEHSIL$/i, "");
  return MAHARASHTRA_DISTRICT_MAP[normalized] || normalized;
};

/**
 * 1. Google Geocoding API Reverse Geocoding (Primary - Most Accurate)
 * Docs: https://developers.google.com/maps/documentation/geocoding
 */
const reverseGeocodeGoogle = async (lat, lon) => {
  try {
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') {
      throw new Error('Google Geocoding API key not configured');
    }

    console.log('🌍 [Google] Attempting reverse geocoding...');
    console.log(`   Coordinates: ${lat}, ${lon}`);

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lon}`,
        key: GOOGLE_API_KEY,
        result_type: 'administrative_area_level_3|administrative_area_level_2|locality',
        language: 'en'
      },
      timeout: 10000
    });

    const data = response.data;
    
    if (!data || data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Google API returned status: ${data?.status || 'UNKNOWN'}`);
    }

    console.log(`   ✅ [Google] Found ${data.results.length} results`);

    // Extract location components from the first result
    let state = null;
    let district = null;
    let city = null;
    let country = null;

    for (const result of data.results) {
      const components = result.address_components;
      
      for (const component of components) {
        const types = component.types;
        
        // State
        if (types.includes('administrative_area_level_1') && !state) {
          state = component.long_name;
        }
        
        // District (administrative_area_level_3 is district in India)
        if (types.includes('administrative_area_level_3') && !district) {
          district = component.long_name;
        }
        
        // Fallback to administrative_area_level_2 for district
        if (types.includes('administrative_area_level_2') && !district) {
          district = component.long_name;
        }
        
        // City
        if (types.includes('locality') && !city) {
          city = component.long_name;
        }
        
        // Country
        if (types.includes('country') && !country) {
          country = component.long_name;
        }
      }
      
      // If we found both state and district, we're good
      if (state && district) break;
    }

    // Normalize district name
    const normalizedDistrict = normalizeDistrictName(district);

    console.log(`   📍 [Google] Detected:`);
    console.log(`      Country: ${country}`);
    console.log(`      State: ${state}`);
    console.log(`      District: ${district} → ${normalizedDistrict}`);
    console.log(`      City: ${city}`);

    if (!state || !normalizedDistrict) {
      throw new Error('Could not extract state or district from Google response');
    }

    return {
      state: state,
      district: normalizedDistrict,
      city: city || normalizedDistrict,
      country: country || 'India',
      formatted: data.results[0].formatted_address,
      coordinates: {
        latitude: lat,
        longitude: lon
      },
      accuracy: data.results[0].geometry?.location_type || 'APPROXIMATE',
      source: 'Google',
      raw: data.results[0]
    };

  } catch (error) {
    console.error(`   ❌ [Google] Failed: ${error.message}`);
    throw error;
  }
};

/**
 * 2. MapmyIndia Reverse Geocoding (Backup for India)
 * Docs: https://www.mapmyindia.com/api/advanced-maps/doc/reverse-geocoding
 */
const reverseGeocodeMapMyIndia = async (lat, lon) => {
  try {
    if (!MAPMYINDIA_API_KEY || MAPMYINDIA_API_KEY === 'YOUR_MAPMYINDIA_API_KEY_HERE') {
      throw new Error('MapmyIndia API key not configured');
    }

    console.log('🇮🇳 [MapmyIndia] Attempting reverse geocoding...');

    const response = await axios.get('https://apis.mapmyindia.com/advancedmaps/v1/' + MAPMYINDIA_API_KEY + '/rev_geocode', {
      params: {
        lat: lat,
        lng: lon
      },
      timeout: 5000
    });

    const data = response.data;
    
    if (!data || data.responseCode !== 200) {
      throw new Error(`MapmyIndia API error: ${data.responseCode}`);
    }

    const results = data.results[0];
    
    // MapmyIndia returns very accurate district data
    const district = results.district || results.subDistrict || null;
    const state = results.state || null;
    const city = results.city || results.locality || null;
    
    console.log('✅ [MapmyIndia] Raw response:', {
      district: results.district,
      state: results.state,
      city: results.city,
      subDistrict: results.subDistrict
    });

    // Normalize for Maharashtra
    let normalizedDistrict = district;
    if (state === 'Maharashtra' && district) {
      normalizedDistrict = normalizeDistrictName(district);
    }

    const location = {
      state: state,
      district: normalizedDistrict,
      city: city,
      country: 'India',
      formatted: results.formatted_address || `${city}, ${district}, ${state}`,
      coordinates: { latitude: lat, longitude: lon },
      accuracy: results.accuracy || 'high',
      source: 'MapmyIndia',
      raw: results
    };

    console.log('✅ [MapmyIndia] SUCCESS:', {
      state: location.state,
      district: location.district,
      city: location.city
    });

    return location;

  } catch (error) {
    console.error('❌ [MapmyIndia] Failed:', error.message);
    
    if (error.response?.status === 401) {
      console.error('❌ [MapmyIndia] Invalid API key');
    } else if (error.response?.status === 429) {
      console.error('❌ [MapmyIndia] Rate limit exceeded');
    }
    
    throw error;
  }
};

/**
 * 2. Geoapify Reverse Geocoding (Global Coverage, Good for India)
 * Docs: https://apidocs.geoapify.com/docs/geocoding/reverse-geocoding
 */
const reverseGeocodeGeoapify = async (lat, lon) => {
  try {
    if (!GEOAPIFY_API_KEY || GEOAPIFY_API_KEY === 'YOUR_GEOAPIFY_API_KEY_HERE') {
      throw new Error('Geoapify API key not configured');
    }

    console.log('🌍 [Geoapify] Attempting reverse geocoding...');

    const response = await axios.get('https://api.geoapify.com/v1/geocode/reverse', {
      params: {
        lat: lat,
        lon: lon,
        apiKey: GEOAPIFY_API_KEY,
        format: 'json'
      },
      timeout: 5000
    });

    const data = response.data;
    
    if (!data || !data.results || data.results.length === 0) {
      throw new Error('No results from Geoapify');
    }

    const result = data.results[0];
    
    console.log('✅ [Geoapify] Full raw response:', {
      county: result.county,
      state_district: result.state_district,
      district: result.district,
      city: result.city,
      state: result.state,
      suburb: result.suburb,
      quarter: result.quarter
    });
    
    // Geoapify returns Indian administrative divisions
    // For India: county contains district, district/suburb contain localities
    const district = 
      result.county ||              // Primary: District level
      result.state_district ||      // Backup: State district
      result.city ||                // Fallback: City name for city-districts
      null;
    
    const state = result.state || null;
    const city = result.city || result.town || result.village || null;

    // Normalize for Maharashtra
    let normalizedDistrict = district;
    if (state === 'Maharashtra' && district) {
      normalizedDistrict = normalizeDistrictName(district);
    }

    const location = {
      state: state,
      district: normalizedDistrict,
      city: city,
      country: result.country || 'India',
      formatted: result.formatted || `${city}, ${district}, ${state}`,
      coordinates: { latitude: lat, longitude: lon },
      accuracy: result.rank?.confidence || 0.8,
      source: 'Geoapify',
      raw: result
    };

    console.log('✅ [Geoapify] SUCCESS:', {
      state: location.state,
      district: location.district,
      city: location.city
    });

    return location;

  } catch (error) {
    console.error('❌ [Geoapify] Failed:', error.message);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('❌ [Geoapify] Invalid API key');
    } else if (error.response?.status === 429) {
      console.error('❌ [Geoapify] Rate limit exceeded');
    }
    
    throw error;
  }
};

/**
 * 3. LocationIQ Reverse Geocoding (Last Resort, OpenStreetMap based)
 * Docs: https://locationiq.com/docs#reverse-geocoding
 */
const reverseGeocodeLocationIQ = async (lat, lon) => {
  try {
    if (!LOCATIONIQ_API_KEY || LOCATIONIQ_API_KEY === 'YOUR_LOCATIONIQ_API_KEY_HERE') {
      throw new Error('LocationIQ API key not configured');
    }

    console.log('📍 [LocationIQ] Attempting reverse geocoding...');

    const response = await axios.get('https://us1.locationiq.com/v1/reverse.php', {
      params: {
        key: LOCATIONIQ_API_KEY,
        lat: lat,
        lon: lon,
        format: 'json',
        normalizecity: 1,
        addressdetails: 1,
        accept_language: 'en'
      },
      timeout: 5000
    });

    const data = response.data;
    const address = data.address || {};

    console.log('✅ [LocationIQ] Raw response:', {
      state_district: address.state_district,
      county: address.county,
      state: address.state,
      city: address.city
    });

    const state = 
      address.state || 
      address.state_district || 
      address.region || 
      null;
    
    // Priority: state_district > city > county
    let district = null;
    if (address.state_district && address.state_district !== state) {
      district = address.state_district;
    } else if (address.city && state === 'Maharashtra') {
      district = address.city;
    } else if (address.county) {
      district = address.county;
    } else if (address.district) {
      district = address.district;
    }
    
    const city = 
      address.city || 
      address.town || 
      address.village || 
      null;

    // Normalize for Maharashtra
    let normalizedDistrict = district;
    if (state === 'Maharashtra' && district) {
      normalizedDistrict = normalizeDistrictName(district);
    }

    const location = {
      state: state,
      district: normalizedDistrict,
      city: city,
      country: address.country || 'India',
      formatted: data.display_name,
      coordinates: { latitude: lat, longitude: lon },
      accuracy: data.importance || 0.5,
      source: 'LocationIQ',
      raw: address
    };

    console.log('✅ [LocationIQ] SUCCESS:', {
      state: location.state,
      district: location.district,
      city: location.city
    });

    return location;

  } catch (error) {
    console.error('❌ [LocationIQ] Failed:', error.message);
    
    if (error.response?.status === 401) {
      console.error('❌ [LocationIQ] Invalid API key');
    } else if (error.response?.status === 429) {
      console.error('❌ [LocationIQ] Rate limit exceeded');
    }
    
    throw error;
  }
};

/**
 * Main function: Try APIs in order with fallback chain
 * Priority: Google > MapmyIndia > Geoapify > LocationIQ
 */
export const getLiveDistrict = async (lat, lon) => {
  const errors = [];

  console.log('\n🎯 ===== MULTI-API GEOLOCATION START =====');
  console.log(`📍 Coordinates: Latitude ${lat}, Longitude ${lon}`);
  console.log('🔄 Fallback Chain: Google → MapmyIndia → Geoapify → LocationIQ\n');

  // 1. Try Google first (most accurate globally)
  if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'YOUR_GOOGLE_API_KEY_HERE') {
    try {
      const result = await reverseGeocodeGoogle(lat, lon);
      if (result.district && result.state) {
        console.log('\n✅ ===== SUCCESS: Google Geocoding API =====');
        console.log(`   State: ${result.state}`);
        console.log(`   District: ${result.district}`);
        console.log(`   City: ${result.city}`);
        console.log(`   Accuracy: ${result.accuracy}\n`);
        return result;
      }
    } catch (error) {
      errors.push({ api: 'Google', error: error.message });
      console.log('⚠️ Google failed, trying next API...\n');
    }
  } else {
    console.log('⏭️ Google API key not configured, skipping...\n');
  }

  // 2. Try MapmyIndia (accurate for India)
  if (MAPMYINDIA_API_KEY && MAPMYINDIA_API_KEY !== 'YOUR_MAPMYINDIA_API_KEY_HERE') {
    try {
      const result = await reverseGeocodeMapMyIndia(lat, lon);
      if (result.district && result.state) {
        console.log('\n✅ ===== SUCCESS: MapmyIndia =====\n');
        return result;
      }
    } catch (error) {
      errors.push({ api: 'MapmyIndia', error: error.message });
      console.log('⚠️ MapmyIndia failed, trying next API...\n');
    }
  } else {
    console.log('⏭️ MapmyIndia API key not configured, skipping...\n');
  }

  // 3. Try Geoapify (good global coverage)
  if (GEOAPIFY_API_KEY && GEOAPIFY_API_KEY !== 'YOUR_GEOAPIFY_API_KEY_HERE') {
    try {
      const result = await reverseGeocodeGeoapify(lat, lon);
      if (result.district && result.state) {
        console.log('\n✅ ===== SUCCESS: Geoapify =====\n');
        return result;
      }
    } catch (error) {
      errors.push({ api: 'Geoapify', error: error.message });
      console.log('⚠️ Geoapify failed, trying next API...\n');
    }
  } else {
    console.log('⏭️ Geoapify API key not configured, skipping...\n');
  }

  // 4. Try LocationIQ (last resort)
  if (LOCATIONIQ_API_KEY && LOCATIONIQ_API_KEY !== 'YOUR_LOCATIONIQ_API_KEY_HERE') {
    try {
      const result = await reverseGeocodeLocationIQ(lat, lon);
      if (result.district && result.state) {
        console.log('\n✅ ===== SUCCESS: LocationIQ =====\n');
        return result;
      }
    } catch (error) {
      errors.push({ api: 'LocationIQ', error: error.message });
      console.log('⚠️ LocationIQ failed\n');
    }
  } else {
    console.log('⏭️ LocationIQ API key not configured, skipping...\n');
  }

  // All APIs failed
  console.error('\n❌ ===== ALL APIS FAILED =====');
  console.error('Errors:', errors);
  console.log('💡 Please configure at least one API key in .env file\n');

  throw new Error('District detection unavailable. All geocoding APIs failed.');
};

/**
 * Validate if detected location is in Maharashtra
 */
export const isInMaharashtra = (location) => {
  return location && location.state === 'Maharashtra';
};

export default {
  getLiveDistrict,
  isInMaharashtra
};
