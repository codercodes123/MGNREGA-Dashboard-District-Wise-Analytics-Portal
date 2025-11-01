import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

/** Maharashtra district corrections and variations */
const MAHARASHTRA_DISTRICT_MAP = {
  // Official name changes
  AURANGABAD: "CHATRAPATI SAMBHAJI NAGAR",
  OSMANABAD: "DHARASHIV",
  
  // Spelling variations
  AHMADNAGAR: "AHMEDNAGAR",
  BULDANA: "BULDHANA",
  GONDIYA: "GONDIA",
  
  // Alternative spellings
  "CHATRAPATI SAMBHAJINAGAR": "CHATRAPATI SAMBHAJI NAGAR",
  "CHHATRAPATI SAMBHAJI NAGAR": "CHATRAPATI SAMBHAJI NAGAR",
  "SAMBHAJI NAGAR": "CHATRAPATI SAMBHAJI NAGAR",
  
  // Taluka to District mappings (LocationIQ returns taluka in county field)
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
    .replace(/\s+TEHSIL$/i, "");
  return MAHARASHTRA_DISTRICT_MAP[normalized] || normalized;
};

/** Reverse geocode coordinates using LocationIQ */
export const reverseGeocode = async (lat, lon) => {
  try {
    if (!LOCATIONIQ_API_KEY)
      throw new Error("❌ LocationIQ API key not configured");

    const { data } = await axios.get("https://us1.locationiq.com/v1/reverse.php", {
      params: {
        key: LOCATIONIQ_API_KEY,
        lat,
        lon,
        format: "json",
        normalizecity: 1,
        addressdetails: 1,
        accept_language: "en",
      },
    });

    const address = data.address || {};

    console.log('📍 Raw LocationIQ response:', {
      lat: lat,
      lon: lon,
      address: address
    });

    // Extract location components
    let state = 
      address.state || 
      address.state_district || 
      address.region || 
      null;
    
    // District extraction with improved priority for Maharashtra
    // Priority order for Indian districts (LocationIQ specific):
    // 1. state_district (contains actual district name)
    // 2. city (for city-districts like Mumbai, Pune)
    // 3. county (contains taluk/subdivision, needs mapping)
    // 4. district (general fallback)
    let district = null;
    
    // Try multiple fields in order of reliability
    if (address.state_district && address.state_district !== state) {
      district = address.state_district;
      console.log('✓ Using state_district:', district);
    } else if (address.city && state === 'Maharashtra') {
      district = address.city;
      console.log('✓ Using city (Maharashtra):', district);
    } else if (address.county) {
      // County often contains taluka name - will be mapped to district
      district = address.county;
      console.log('✓ Using county (taluka):', district);
    } else if (address.district) {
      district = address.district;
      console.log('✓ Using district:', district);
    } else if (address.city_district) {
      district = address.city_district;
      console.log('✓ Using city_district:', district);
    } else {
      console.warn('⚠️ No district field found in address');
    }
    
    let city = 
      address.city || 
      address.town || 
      address.village || 
      address.municipality ||
      null;
    
    let country = address.country || null;

    console.log('📊 Extracted before normalization:', {
      state,
      district,
      city,
      country
    });

    // For Maharashtra, normalize district names
    if (state === 'Maharashtra' && district) {
      const originalDistrict = district;
      district = normalizeDistrictName(district);
      if (originalDistrict !== district) {
        console.log(`🔄 Normalized: "${originalDistrict}" → "${district}"`);
      }
    }

    return {
      state,
      district,
      city,
      country: address.country || null,
      formatted: data.display_name,
      coordinates: { latitude: lat, longitude: lon },
      accuracy: data.importance || 0.5,
    };
  } catch (err) {
    console.error("Geocoding error:", err.message);
    if (err.response?.status === 401)
      throw new Error("Invalid LocationIQ API key");
    if (err.response?.status === 429)
      throw new Error("Rate limit exceeded");
    throw err;
  }
};

/** Check if the location is in Maharashtra */
export const isInMaharashtra = (location) =>
  location?.state === "Maharashtra";

/** Get user's live geolocation + reverse geocode it */
export const getLiveLocation = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(new Error("Geolocation not supported by browser"));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const location = await reverseGeocode(latitude, longitude);
          if (!isInMaharashtra(location)) {
            location.warning = "⚠️ Outside Maharashtra region";
          }
          resolve(location);
        } catch (err) {
          reject(err);
        }
      },
      (err) => {
        reject(new Error(`Failed to get live location: ${err.message}`));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

export default { reverseGeocode, getLiveLocation, isInMaharashtra };
