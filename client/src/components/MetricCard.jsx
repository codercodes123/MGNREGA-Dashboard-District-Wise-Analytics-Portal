import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatIndianNumber, formatCurrency, calculatePercentageChange } from '../utils/formatters';

const MetricCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  format = 'number',
  colorClass = 'text-primary-600 bg-primary-50'
}) => {
  const percentageChange = previousValue 
    ? calculatePercentageChange(value, previousValue)
    : null;

  const formatValue = (val) => {
    if (!val && val !== 0) return '-';
    
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'number':
      default:
        return formatIndianNumber(val);
    }
  };

  const getTrendIcon = () => {
    if (!percentageChange) return null;
    
    if (percentageChange > 0) {
      return <TrendingUp className="w-4 h-4 text-success-600" />;
    } else if (percentageChange < 0) {
      return <TrendingDown className="w-4 h-4 text-primary-600" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="card hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </h3>
        </div>
        
        {Icon && (
          <div className={`icon-container ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900">
          {formatValue(value)}
        </div>
      </div>
      
      {percentageChange !== null && (
        <div className="flex items-center gap-1 text-sm">
          {getTrendIcon()}
          <span className={percentageChange >= 0 ? 'text-success-600' : 'text-primary-600'}>
            {Math.abs(percentageChange).toFixed(1)}%
          </span>
          <span className="text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
