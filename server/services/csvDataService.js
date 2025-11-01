import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csvtojson';

// In-memory cache
let csvData = [];
let lastLoadedAt = null;

/**
 * Auto-detect column value from multiple possible names
 */
function getColumnValue(row, possibleNames) {
  for (const name of possibleNames) {
    const value = row[name];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_LOCAL_PATH = path.resolve(__dirname, '..', 'models', 'data.csv');

async function loadFromFile(filePath = CSV_LOCAL_PATH) {
  try {
    const exists = fs.existsSync(filePath);
    if (!exists) {
      console.warn(`⚠️ CSV not found at ${filePath}. Skipping load.`);
      csvData = [];
      return { count: 0, lastLoadedAt };
    }

    console.log(`📥 Loading CSV from ${filePath} ...`);
    const jsonArray = await csv({ trim: true }).fromFile(filePath);
    csvData = jsonArray;
    lastLoadedAt = new Date();
    console.log(`✅ CSV loaded into memory. Records: ${csvData.length}. Time: ${lastLoadedAt.toISOString()}`);
    return { count: csvData.length, lastLoadedAt };
  } catch (err) {
    console.error('❌ Failed to load CSV:', err.message);
    throw err;
  }
}

function getAll() {
  return csvData;
}

function filter({ state, district } = {}) {
  let result = csvData;

  if (state) {
    const stateLower = state.toString().toLowerCase();
    result = result.filter(row => {
      const statePossibleNames = [
        'state_name', 'State Name', 'STATE_NAME',
        'state', 'State', 'STATE',
        'StateName'
      ];
      const rowState = getColumnValue(row, statePossibleNames);
      return rowState && rowState.toString().toLowerCase().includes(stateLower);
    });
  }

  if (district) {
    const districtLower = district.toString().toLowerCase();
    result = result.filter(row => {
      const districtPossibleNames = [
        'district_name', 'District Name', 'DISTRICT_NAME',
        'district', 'District', 'DISTRICT',
        'DistrictName'
      ];
      const rowDistrict = getColumnValue(row, districtPossibleNames);
      return rowDistrict && rowDistrict.toString().toLowerCase().includes(districtLower);
    });
  }

  return result;
}

function meta() {
  return {
    lastLoadedAt,
    count: csvData.length,
    path: CSV_LOCAL_PATH,
  };
}

/**
 * Get unique list of states from CSV
 */
function getStates() {
  const stateSet = new Set();
  
  csvData.forEach(row => {
    // Auto-detect state column
    const statePossibleNames = [
      'state_name', 'State Name', 'STATE_NAME',
      'state', 'State', 'STATE',
      'StateName'
    ];
    const state = getColumnValue(row, statePossibleNames);
    
    if (state) {
      stateSet.add(state.toString().trim());
    }
  });
  
  // Convert to array and sort alphabetically
  const states = Array.from(stateSet).sort((a, b) => 
    a.localeCompare(b, 'en', { sensitivity: 'base' })
  );
  
  return states.map(name => ({
    name,
    code: name.toLowerCase().replace(/\s+/g, '-'),
    nameHindi: name // Could add Hindi mapping if available in CSV
  }));
}

/**
 * Get unique list of districts for a given state
 */
function getDistricts(stateName) {
  if (!stateName) return [];
  
  const districtSet = new Set();
  const stateNameLower = stateName.toLowerCase();
  
  csvData.forEach(row => {
    // Auto-detect state column
    const statePossibleNames = [
      'state_name', 'State Name', 'STATE_NAME',
      'state', 'State', 'STATE',
      'StateName'
    ];
    const rowState = getColumnValue(row, statePossibleNames);
    
    // Auto-detect district column
    const districtPossibleNames = [
      'district_name', 'District Name', 'DISTRICT_NAME',
      'district', 'District', 'DISTRICT',
      'DistrictName'
    ];
    const rowDistrict = getColumnValue(row, districtPossibleNames);
    
    if (rowState && rowState.toString().toLowerCase().trim() === stateNameLower && rowDistrict) {
      districtSet.add(rowDistrict.toString().trim());
    }
  });
  
  // Convert to array and sort alphabetically
  const districts = Array.from(districtSet).sort((a, b) => 
    a.localeCompare(b, 'en', { sensitivity: 'base' })
  );
  
  return districts.map(name => ({
    name,
    code: name.toLowerCase().replace(/\s+/g, '-')
  }));
}

/**
 * Check if a state/district combination exists in the data
 */
function locationExists(stateName, districtName) {
  if (!stateName || !districtName) return false;
  
  const stateNameLower = stateName.toLowerCase();
  const districtNameLower = districtName.toLowerCase();
  
  return csvData.some(row => {
    // Auto-detect state column
    const statePossibleNames = [
      'state_name', 'State Name', 'STATE_NAME',
      'state', 'State', 'STATE',
      'StateName'
    ];
    const rowState = getColumnValue(row, statePossibleNames);
    
    // Auto-detect district column
    const districtPossibleNames = [
      'district_name', 'District Name', 'DISTRICT_NAME',
      'district', 'District', 'DISTRICT',
      'DistrictName'
    ];
    const rowDistrict = getColumnValue(row, districtPossibleNames);
    
    return rowState && rowDistrict &&
           rowState.toString().toLowerCase().trim() === stateNameLower && 
           rowDistrict.toString().toLowerCase().trim() === districtNameLower;
  });
}

export default {
  loadFromFile,
  getAll,
  filter,
  meta,
  getStates,
  getDistricts,
  locationExists,
  CSV_LOCAL_PATH,
};
