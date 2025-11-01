import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, TrendingUp, Users, DollarSign, Award, MapPin } from 'lucide-react';
import axios from 'axios';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
import PageTransition from '../components/PageTransition';
import { getDistrictName } from '../utils/districtTranslation';

const Leaderboard = () => {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/leaderboard`);
      
      // Handle new Maharashtra district format
      if (response.data && response.data.success && response.data.leaderboard) {
        setLeaderboard(response.data.leaderboard);
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback for old format
        setLeaderboard(response.data);
      } else {
        setError('Invalid leaderboard data');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || t('errors.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getMedalIcon = (rank) => {
    if (rank <= 3) return <Award className={`w-8 h-8 ${getMedalColor(rank)}`} />;
    return <span className="text-2xl font-bold text-gray-500">#{rank}</span>;
  };

  const getPerformanceColor = (rank, total) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 33) return 'bg-green-100 text-green-800 border-green-300';
    if (percentage <= 66) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <ErrorMessage message={error} onRetry={fetchLeaderboard} />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('leaderboard.title', '🏆 जिल्हा रँकिंग')}
            </h1>
            <p className="text-gray-600">
              {t('leaderboard.subtitle', 'महाराष्ट्रातील सर्व 35 जिल्हे - मनरेगा कामगिरी रँकिंग')}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              <MapPin className="w-4 h-4" />
              <span className="font-semibold">महाराष्ट्र</span>
            </div>
          </div>

          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {/* 2nd Place */}
              <div className="md:order-1 order-2">
                <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 text-center transform md:translate-y-4">
                  <div className="flex justify-center mb-3">
                    <Award className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {getDistrictName(leaderboard[1]?.district, t)}
                  </h3>
                  <div className="inline-block bg-gray-200 text-gray-800 px-4 py-1 rounded-full text-sm font-semibold mb-3">
                    🥈 #2
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">गुण (Score)</span>
                      <span className="font-semibold">{leaderboard[1]?.score?.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">रोजगार</span>
                      <span className="font-semibold">{formatNumber(leaderboard[1]?.metrics?.employmentProvided)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="md:order-2 order-1">
                <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 text-center">
                  <div className="flex justify-center mb-3">
                    <Award className="w-16 h-16 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {getDistrictName(leaderboard[0]?.district, t)}
                  </h3>
                  <div className="inline-block bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full text-lg font-bold mb-3">
                    🥇 #1
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">गुण (Score)</span>
                      <span className="font-semibold text-lg">{leaderboard[0]?.score?.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">रोजगार</span>
                      <span className="font-semibold text-lg">{formatNumber(leaderboard[0]?.metrics?.employmentProvided)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="md:order-3 order-3">
                <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400 text-center transform md:translate-y-8">
                  <div className="flex justify-center mb-3">
                    <Award className="w-10 h-10 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {getDistrictName(leaderboard[2]?.district, t)}
                  </h3>
                  <div className="inline-block bg-orange-200 text-orange-900 px-4 py-1 rounded-full text-sm font-semibold mb-3">
                    🥉 #3
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">गुण (Score)</span>
                      <span className="font-semibold">{leaderboard[2]?.score?.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">रोजगार</span>
                      <span className="font-semibold">{formatNumber(leaderboard[2]?.metrics?.employmentProvided)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary-600" />
              {t('leaderboard.fullRankings', 'Complete Rankings')}
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('leaderboard.rank')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('leaderboard.district')}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        📊
                        {t('leaderboard.score')}
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        💼
                        {t('leaderboard.employment')}
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        ✅
                        {t('leaderboard.works')}
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('leaderboard.category')}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((district, index) => (
                    <tr 
                      key={district.district} 
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index < 3 ? 'bg-yellow-50/30' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getMedalIcon(district.rank)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{getDistrictName(district.district, t)}</div>
                        <div className="text-sm text-gray-500 sm:hidden">
                          {district.icon} {district.category === 'Excellent' ? t('leaderboard.excellent') : district.category === 'Good' ? t('leaderboard.good') : district.category === 'Average' ? t('leaderboard.average') : t('leaderboard.needsImprovement')}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium hidden sm:table-cell">
                        <span className="text-lg font-bold">{district.score?.toFixed(1)}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium hidden md:table-cell">
                        {formatNumber(district.metrics?.employmentProvided)}
                      </td>
                      <td className="py-4 px-4 text-center hidden lg:table-cell">
                        <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm">
                          {district.metrics?.worksCompleted || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium`}>
                          {district.icon} {district.category === 'Excellent' ? t('leaderboard.excellent') : district.category === 'Good' ? t('leaderboard.good') : district.category === 'Average' ? t('leaderboard.average') : t('leaderboard.needsImprovement')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              {t('leaderboard.howRanked', 'How are states ranked?')}
            </h3>
            <p className="text-sm text-gray-700">
              States are ranked based on a performance score calculated from total person-days (60% weight) and 
              total expenditure (40% weight). This reflects both the employment generation and financial outreach 
              of MGNREGA schemes across districts.
            </p>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Leaderboard;
