import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronDown, AlertCircle, X } from 'lucide-react';
import { apiService } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
import PageTransition from '../components/PageTransition';

const Select = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [error, setError] = useState(null);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  
  // Cache for states and districts
  const statesCache = useRef(null);
  const districtsCache = useRef({});

  // Load states on mount
  useEffect(() => {
    loadStates();
    
    // Check if location was not found in data
    if (location.state?.locationNotFound) {
      setShowLocationAlert(true);
      setDetectedLocation({
        state: location.state.detectedState,
        district: location.state.detectedDistrict
      });
    }
    
    // Check if auto-detected location was passed
    if (location.state?.autoDetectedState) {
      setSelectedState(location.state.autoDetectedState);
      if (location.state?.autoDetectedDistrict) {
        setSelectedDistrict(location.state.autoDetectedDistrict);
      }
    }
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (selectedState) {
      loadDistricts(selectedState);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedState]);

  const loadStates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      if (statesCache.current) {
        setStates(statesCache.current);
        setLoading(false);
        return;
      }
      
      const response = await apiService.getStates();
      const statesData = response.data || [];
      
      // Cache the states
      statesCache.current = statesData;
      setStates(statesData);
    } catch (err) {
      console.error('Error loading states:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (state) => {
    try {
      setLoadingDistricts(true);
      setError(null);
      
      // Check cache first
      if (districtsCache.current[state]) {
        setDistricts(districtsCache.current[state]);
        setLoadingDistricts(false);
        return;
      }
      
      const response = await apiService.getDistricts(state);
      const districtsData = response.data || [];
      
      // Cache the districts for this state
      districtsCache.current[state] = districtsData;
      setDistricts(districtsData);
    } catch (err) {
      console.error('Error loading districts:', err);
      setError(err.message);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleContinue = () => {
    if (selectedState && selectedDistrict) {
      navigate('/dashboard', {
        state: {
          state: selectedState,
          district: selectedDistrict
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (error && states.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} onRetry={loadStates} />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('selection.selectState')}
            </h2>
            <p className="text-gray-600">
              Choose your state and district to view MGNREGA performance
            </p>
          </div>

          {/* Location Not Found Alert */}
          {showLocationAlert && (
            <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    {t('selection.locationNotFound', 'Your district is not listed in MGNREGA data')}
                  </h3>
                  {detectedLocation && (
                    <p className="text-sm text-yellow-800 mb-2">
                      We detected: <strong>{detectedLocation.district}, {detectedLocation.state}</strong>
                    </p>
                  )}
                  <p className="text-sm text-yellow-700">
                    {t('selection.pleaseSelectManually', 'Please select your location manually from the dropdowns below.')}
                  </p>
                </div>
                <button
                  onClick={() => setShowLocationAlert(false)}
                  className="text-yellow-600 hover:text-yellow-800 transition-colors"
                  aria-label="Close alert"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Selection Cards */}
          <div className="space-y-6">
            {/* State Selection */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('selection.selectState')}
              </label>
              
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="select appearance-none pr-10"
                >
                  <option value="">{t('selection.statePlaceholder')}</option>
                  {states.map((state) => (
                    <option key={state.code} value={state.name}>
                      {state.name} / {state.nameHindi}
                    </option>
                  ))}
                </select>
                
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* District Selection */}
            {selectedState && (
              <div className="card animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('selection.selectDistrict')}
                </label>
                
                {loadingDistricts ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="text-sm text-gray-600">
                      {t('common.loading', 'Fetching districts...')}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="select appearance-none pr-10"
                      disabled={districts.length === 0}
                    >
                      <option value="">{t('selection.districtPlaceholder')}</option>
                      {districts.map((district, index) => (
                        <option key={district.code || index} value={district.name}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                    
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>
            )}

            {/* Continue Button */}
            {selectedState && selectedDistrict && (
              <button
                onClick={handleContinue}
                className="w-full btn btn-primary flex items-center justify-center gap-2 py-4 text-lg animate-fadeIn"
              >
                <span>{t('selection.continue')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help? Visit our <a href="/help" className="text-primary-600 hover:underline">help page</a>
            </p>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Select;
