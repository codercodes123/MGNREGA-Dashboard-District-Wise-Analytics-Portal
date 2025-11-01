import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Home,
  Calendar,
  TrendingUp,
  DollarSign,
  Briefcase,
  RefreshCw,
  Download,
  Share2,
  ArrowLeft,
  Award
} from 'lucide-react';
import { apiService } from '../services/api';
import MetricCard from '../components/MetricCard';
import TrendChart from '../components/TrendChart';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageTransition from '../components/PageTransition';
import ErrorMessage from '../components/ErrorMessage';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * Transform API response to match Dashboard expectations
 */
const transformAPIResponse = (response) => {
  const rawData = response.data || response;
  
  // If data already has metrics structure, return as is
  if (rawData.metrics) {
    return rawData;
  }
  
  // Transform flat structure to nested metrics structure (matches imported CSV)
  return {
    financialYear: rawData.financial_year || new Date().getFullYear().toString(),
    lastUpdated: rawData.lastUpdated || new Date(),
    state: rawData.state_name || rawData.state,
    district: rawData.district_name || rawData.district,
    metrics: {
      employmentProvided: rawData.total_households_worked || 0,
      householdsWorked: rawData.total_households_worked || 0,
      totalPersonDays: rawData.total_persondays_generated || 0,
      womenPersonDays: rawData.total_women_persondays || 0,
      scPersonDays: rawData.sc_persondays || 0,
      stPersonDays: rawData.st_persondays || 0,
      totalExpenditure: rawData.total_expenditure || 0,
      wageExpenditure: rawData.wage_expenditure || 0,
      materialExpenditure: rawData.material_expenditure || 0,
      worksCompleted: rawData.total_completed_works || 0,
      worksInProgress: rawData.total_ongoing_works || 0,
      totalJobCards: rawData.total_active_job_cards || 0,
      activeJobCards: rawData.total_active_workers || 0,
      avgDaysPerHousehold: rawData.average_days_per_household || 0,
      avgWageRate: rawData.average_wage_per_day || 0
    }
  };
};

const Dashboard = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [rankData, setRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const [, setLastSelection] = useLocalStorage('lastSelection', null);

  const state = location.state?.state;
  const district = location.state?.district;

  useEffect(() => {
    if (!state || !district) {
      navigate('/select');
      return;
    }

    // Save to localStorage
    setLastSelection({ state, district });
    
    // Reset state and trigger auto-refresh to load data
    setData(null);
    setError(null);
    setLoading(true);
    
    // Automatically trigger refresh to ensure data loads properly
    // This mimics clicking the refresh button on page load
    const autoRefresh = async () => {
      try {
        console.log('🔄 Auto-refreshing data on page load...');
        await apiService.refreshData(state, district);
        await loadData();
        await loadHistoricalData();
        await loadRankData();
        console.log('✅ Auto-refresh complete');
      } catch (err) {
        console.error('❌ Auto-refresh failed, trying direct load:', err);
        // Fallback to direct load if refresh fails
        await loadData();
        await loadHistoricalData();
        await loadRankData();
      }
    };
    
    autoRefresh();
  }, [state, district]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching data for: ${district}, ${state}`);
      const response = await apiService.getDistrictData(state, district);
      
      console.log('📦 Raw API Response:', response);
      console.log('📦 Response.data:', response.data);
      
      // Transform API response to match Dashboard expectations
      const transformedData = transformAPIResponse(response);
      
      console.log('🔄 Transformed Data:', transformedData);
      console.log('📊 Metrics Object:', transformedData.metrics);
      
      setData(transformedData);
      
      console.log(`✅ Dashboard data loaded successfully for ${district}`);
      console.log(`   Person-Days: ${transformedData.metrics?.totalPersonDays?.toLocaleString() || '0'}`);
      console.log(`   Expenditure: ₹${((transformedData.metrics?.totalExpenditure || 0) / 10000000).toFixed(2)} Cr`);
      console.log(`   Employment: ${transformedData.metrics?.employmentProvided?.toLocaleString() || '0'}`);
      
    } catch (err) {
      console.error('❌ Failed to fetch data:', err.message);
      setError(err.message || 'Unable to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const response = await apiService.getHistoricalData(state, district, 12);
      setHistoricalData(response.data || []);
    } catch (err) {
      console.error('Failed to load historical data:', err);
    }
  };

  const loadRankData = async () => {
    try {
      const response = await apiService.get(`/rank?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
      setRankData(response.data);
    } catch (err) {
      console.error('Failed to load rank data:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await apiService.refreshData(state, district);
      await loadData();
      await loadHistoricalData();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `MGNREGA Performance - ${district}, ${state}`,
      text: `Check out MGNREGA performance data for ${district}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleDownload = () => {
    // Simple CSV download
    if (!data) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Employment Provided', data.metrics.employmentProvided],
      ['Households Worked', data.metrics.householdsWorked],
      ['Total Person Days', data.metrics.totalPersonDays],
      ['Total Expenditure', data.metrics.totalExpenditure],
      ['Works Completed', data.metrics.worksCompleted],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mgnrega-${district}-${state}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Fetching live data from data.gov.in...</p>
          <p className="text-sm text-gray-500 mt-2">{district}, {state}</p>
        </div>
        <LoadingSkeleton type="metric" count={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} onRetry={loadData} />
      </div>
    );
  }

  // Prepare chart data
  const chartData = historicalData.map(item => ({
    month: `${item.month.substring(0, 3)} ${item.year}`,
    employment: item.metrics.employmentProvided,
    personDays: item.metrics.totalPersonDays,
    expenditure: item.metrics.totalExpenditure / 10000000 // Convert to crores (1 Cr = 10 million)
  })).reverse();

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/select')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('common.back')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                aria-label="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                aria-label="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {district}, {state}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                FY: {data.financialYear}
              </span>
              <span>•</span>
              <span>
                {t('dashboard.lastUpdated')}: {formatRelativeTime(data.lastUpdated)}
              </span>
              {rankData && !rankData.error && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Award className="w-4 h-4 text-yellow-600" />
                    Rank {rankData.rank} of {rankData.totalDistricts} in {state}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* District Rank Badge */}
          {rankData && !rankData.error && (
            <div className="mt-4 inline-flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl px-5 py-4 shadow-md">
              <div className="text-5xl">
                {rankData.rank === 1 ? '🥇' : 
                 rankData.rank === 2 ? '🥈' :
                 rankData.rank === 3 ? '🥉' : '🏆'}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">District Ranking</div>
                <div className="font-bold text-xl text-gray-900">
                  🏆 Rank {rankData.rank} out of {rankData.totalDistricts} districts in {state}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Based on person-days and expenditure performance
                </div>
                {rankData.percentile && (
                  <div className="text-xs font-medium text-green-600 mt-1">
                    Top {rankData.percentile}% performer
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b">
            {['overview', 'trends'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                  selectedTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'overview' ? t('dashboard.overview') : t('dashboard.trends')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Key Performance Indicators
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title={t('metrics.employment')}
                  value={data.metrics.employmentProvided}
                  icon={Users}
                  colorClass="text-primary-600 bg-primary-50"
                />
                
                <MetricCard
                  title={t('metrics.households')}
                  value={data.metrics.householdsWorked}
                  icon={Home}
                  colorClass="text-success-600 bg-success-50"
                />
                
                <MetricCard
                  title={t('metrics.personDays')}
                  value={data.metrics.totalPersonDays}
                  icon={Calendar}
                  colorClass="text-warning-600 bg-warning-50"
                />
                
                <MetricCard
                  title={t('metrics.expenditure')}
                  value={data.metrics.totalExpenditure}
                  format="currency"
                  icon={DollarSign}
                  colorClass="text-purple-600 bg-purple-50"
                />
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Employment Distribution
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title={t('metrics.womenDays')}
                  value={data.metrics.womenPersonDays}
                  icon={Users}
                  colorClass="text-pink-600 bg-pink-50"
                />
                
                <MetricCard
                  title={t('metrics.scDays')}
                  value={data.metrics.scPersonDays}
                  icon={Users}
                  colorClass="text-blue-600 bg-blue-50"
                />
                
                <MetricCard
                  title={t('metrics.stDays')}
                  value={data.metrics.stPersonDays}
                  icon={Users}
                  colorClass="text-indigo-600 bg-indigo-50"
                />
              </div>
            </div>

            {/* Works & Financial */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Works & Financial Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title={t('metrics.worksCompleted')}
                  value={data.metrics.worksCompleted}
                  icon={TrendingUp}
                  colorClass="text-success-600 bg-success-50"
                />
                
                <MetricCard
                  title={t('metrics.worksInProgress')}
                  value={data.metrics.worksInProgress}
                  icon={Briefcase}
                  colorClass="text-warning-600 bg-warning-50"
                />
                
                <MetricCard
                  title={t('metrics.avgDays')}
                  value={data.metrics.avgDaysPerHousehold}
                  icon={Calendar}
                  colorClass="text-blue-600 bg-blue-50"
                />
                
                <MetricCard
                  title={t('metrics.avgWage')}
                  value={data.metrics.avgWageRate}
                  format="currency"
                  icon={DollarSign}
                  colorClass="text-green-600 bg-green-50"
                />
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'trends' && (
          <div className="space-y-8">
            {historicalData.length > 0 ? (
              <>
                <TrendChart
                  data={chartData}
                  type="line"
                  title="Employment Trends"
                  dataKeys={[
                    { key: 'employment', name: 'Employment Provided' }
                  ]}
                />
                
                <TrendChart
                  data={chartData}
                  type="bar"
                  title="Person Days Generated"
                  dataKeys={[
                    { key: 'personDays', name: 'Total Person Days' }
                  ]}
                />
                
                <TrendChart
                  data={chartData}
                  type="line"
                  title="Expenditure Trends"
                  dataKeys={[
                    { key: 'expenditure', name: 'Total Expenditure' }
                  ]}
                />
              </>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-600">
                  No historical data available for trend analysis
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
};

export default Dashboard;
