import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, ArrowRight, Navigation, Trophy, TrendingUp, HelpCircle } from 'lucide-react';
import { getUserLocation, isGeolocationAvailable } from '../utils/geolocation';
import { useLocalStorage } from '../hooks/useLocalStorage';
import PageTransition from '../components/PageTransition';
import axios from 'axios';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [lastSelection, setLastSelection] = useLocalStorage('lastSelection', null);
  const [topDistricts, setTopDistricts] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);

  // Fetch top 5 districts on mount
  useEffect(() => {
    const fetchTopDistricts = async () => {
      try {
        const apiUrl = 'https://mgnrega-dashboard-district-wise.onrender.com/api';
        const response = await axios.get(`${apiUrl}/maharashtra/top/5`);
        if (response.data.success && response.data.districts) {
          setTopDistricts(response.data.districts);
        }
      } catch (err) {
        console.error('Failed to fetch top districts:', err);
      } finally {
        setLoadingTop(false);
      }
    };
    
    fetchTopDistricts();
  }, []);

  const handleAutoDetect = async () => {
    if (!isGeolocationAvailable()) {
      setError(t('errors.locationError'));
      // Go to manual selection after showing error
      setTimeout(() => navigate('/select'), 2000);
      return;
    }

    setDetecting(true);
    setError(null);

    try {
      const location = await getUserLocation();
      
      if (location.state && location.district) {
        // Check if this location exists in our CSV data
        const apiUrl = 'https://mgnrega-dashboard-district-wise.onrender.com/api';
        const checkResponse = await axios.get(`${apiUrl}/location-check`, {
          params: {
            state: location.state,
            district: location.district
          }
        });
        
        if (checkResponse.data.exists) {
          // Use the normalized names from the server
          const matchedState = checkResponse.data.state;
          const matchedDistrict = checkResponse.data.district;
          
          setLastSelection({
            state: matchedState,
            district: matchedDistrict
          });
          navigate('/dashboard', {
            state: {
              state: matchedState,
              district: matchedDistrict
            }
          });
        } else {
          // Try fuzzy matching with suggestions
          if (checkResponse.data.suggestions && checkResponse.data.suggestions.length > 0) {
            // Show suggestions to user
            const firstSuggestion = checkResponse.data.suggestions[0];
            console.log('Suggested match:', firstSuggestion);
            
            // Automatically use first suggestion if it's in the same state
            if (firstSuggestion.state.toLowerCase() === location.state.toLowerCase()) {
              setLastSelection({
                state: firstSuggestion.state,
                district: firstSuggestion.district
              });
              navigate('/dashboard', {
                state: {
                  state: firstSuggestion.state,
                  district: firstSuggestion.district
                }
              });
              return;
            }
          }
          
          // Location not in data - go to Select page with message
          navigate('/select', {
            state: {
              locationNotFound: true,
              detectedState: location.state,
              detectedDistrict: location.district,
              suggestions: checkResponse.data.suggestions
            }
          });
        }
      } else {
        throw new Error('Could not determine district from location');
      }
    } catch (err) {
      console.error('Geolocation error:', err);
      setError(err.message || t('errors.locationError'));
      // Fallback to manual selection
      setTimeout(() => navigate('/select'), 2000);
    } finally {
      setDetecting(false);
    }
  };

  const handleManualSelect = () => {
    navigate('/select');
  };

  const handleDistrictClick = (district) => {
    setLastSelection({
      state: 'Maharashtra',
      district: district
    });
    navigate('/dashboard', {
      state: {
        state: 'Maharashtra',
        district: district
      }
    });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-warning-50">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="mb-4 sm:mb-6">
            <div className="inline-block bg-white rounded-full p-3 sm:p-4 mb-3 sm:mb-4 shadow-2xl border-4 border-primary-100">
              <img 
                src="/mgnrega-logo.jpg" 
                alt="MGNREGA - Our Voice, Our Rights" 
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
              />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            {t('app.title')}
          </h1>
          
          <p className="text-base sm:text-xl text-gray-600 mb-2 px-2">
            {t('app.subtitle')}
          </p>
          
          <p className="text-sm sm:text-lg text-gray-500 px-2">
            {t('app.tagline')}
          </p>
        </div>

        {/* Top 5 Districts Leaderboard */}
        {!loadingTop && topDistricts.length > 0 && (
          <div className="max-w-6xl mx-auto mb-8 sm:mb-12">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 bg-yellow-50 px-3 sm:px-4 py-2 rounded-full border-2 border-yellow-200 mb-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-900 text-xs sm:text-sm">शीर्ष जिल्हे / Top Districts</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {topDistricts.map((district, index) => (
                <div
                  key={index}
                  onClick={() => handleDistrictClick(district.district)}
                  className="card cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-primary-300 group active:scale-95"
                >
                  <div className="text-center">
                    {/* Rank Badge */}
                    <div className="flex items-center justify-center mb-2 sm:mb-3">
                      <span className="text-2xl sm:text-3xl">{district.rankEmoji}</span>
                      <span className="ml-1 sm:ml-2 text-xl sm:text-2xl font-bold text-gray-700">#{district.rank}</span>
                    </div>
                    
                    {/* District Name */}
                    <h3 className="font-bold text-gray-900 mb-2 text-xs sm:text-sm md:text-base line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                      {district.district}
                    </h3>
                    
                    {/* Score */}
                    <div className="bg-gradient-to-r from-primary-50 to-success-50 rounded-lg py-1.5 sm:py-2 px-2 sm:px-3 mb-2 sm:mb-3">
                      <div className="text-xs text-gray-600 mb-1">स्कोअर / Score</div>
                      <div className="text-xl sm:text-2xl font-bold text-primary-700">{district.score.toFixed(1)}</div>
                    </div>
                    
                    {/* Key Metric */}
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-2">
                      <TrendingUp className="w-3 h-3" />
                      <span>{(district.employment / 1000000).toFixed(2)}M</span>
                    </div>
                    
                    {/* Category Badge */}
                    <div className="inline-block">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {district.category}
                      </span>
                    </div>
                    
                    {/* Click indicator */}
                    <div className="mt-3 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 mx-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto mb-8 sm:mb-12">
          {/* Auto Detect Card */}
          <div className="card group cursor-pointer hover:border-primary-300 border-2 border-transparent transition-all active:scale-95"
               onClick={handleAutoDetect}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full mb-3 sm:mb-4 group-hover:bg-primary-200 transition-colors">
                <Navigation className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
              
              <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
                {t('home.autoDetect')}
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">
                Let us automatically detect your location
              </p>
              
              {detecting ? (
                <div className="flex items-center justify-center gap-2 text-primary-600">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-primary-600"></div>
                  <span className="text-sm sm:text-base">{t('common.loading')}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-primary-600 font-medium group-hover:gap-3 transition-all text-sm sm:text-base">
                  <span>Detect Location</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
            </div>
          </div>

          {/* Manual Select Card */}
          <div className="card group cursor-pointer hover:border-primary-300 border-2 border-transparent transition-all active:scale-95"
               onClick={handleManualSelect}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-success-100 rounded-full mb-3 sm:mb-4 group-hover:bg-success-200 transition-colors">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-success-600" />
              </div>
              
              <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
                {t('home.manualSelect')}
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">
                Choose your state and district from the list
              </p>
              
              <div className="flex items-center justify-center gap-2 text-success-600 font-medium group-hover:gap-3 transition-all text-sm sm:text-base">
                <span>Select Manually</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 sm:p-4 text-center">
              <p className="text-primary-700 text-sm sm:text-base">{error}</p>
              <p className="text-xs sm:text-sm text-primary-600 mt-2">
                Redirecting to manual selection...
              </p>
            </div>
          </div>
        )}

        {/* Last Selection */}
        {lastSelection && (
          <div className="max-w-2xl mx-auto px-4">
            <div className="card bg-gray-50 border-2 border-gray-200">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Last viewed</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  {lastSelection.district}, {lastSelection.state}
                </p>
                <button
                  onClick={() => navigate('/dashboard', { state: lastSelection })}
                  className="btn btn-secondary mt-3 sm:mt-4 text-sm sm:text-base"
                >
                  View Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto mt-12 sm:mt-16">
          {/* Leaderboard Button */}
          <div 
            className="card group cursor-pointer hover:border-warning-300 border-2 border-transparent transition-all active:scale-95"
            onClick={() => navigate('/leaderboard')}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-warning-100 rounded-full mb-3 sm:mb-4 group-hover:bg-warning-200 transition-colors">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-warning-600" />
              </div>
              
              <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
                {t('home.leaderboardTitle')}
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">
                {t('home.leaderboardDesc')}
              </p>
              
              <div className="flex items-center justify-center gap-2 text-warning-600 font-medium group-hover:gap-3 transition-all text-sm sm:text-base">
                <span>{t('home.leaderboardButton')}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Help Button */}
          <div 
            className="card group cursor-pointer hover:border-blue-300 border-2 border-transparent transition-all active:scale-95"
            onClick={() => navigate('/help')}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
                <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              
              <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
                {t('home.helpTitle')}
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">
                {t('home.helpDesc')}
              </p>
              
              <div className="flex items-center justify-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all text-sm sm:text-base">
                <span>{t('home.helpButton')}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Home;
