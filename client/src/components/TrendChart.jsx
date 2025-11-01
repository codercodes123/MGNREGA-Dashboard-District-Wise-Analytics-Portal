import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  LabelList
} from 'recharts';
import { formatCurrency, abbreviateNumber, abbreviateNumberI18n } from '../utils/formatters';

const TrendChart = ({ data, type = 'line', dataKeys = [], title }) => {
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {abbreviateNumberI18n(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom label component for displaying values
  const renderCustomLabel = (props) => {
    const { x, y, width, height, value } = props;
    const displayValue = abbreviateNumberI18n(value);
    
    // For bars, position label on top
    if (type === 'bar') {
      return (
        <text 
          x={x + width / 2} 
          y={y - 5} 
          fill="#374151" 
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
        >
          {displayValue}
        </text>
      );
    }
    
    // For lines, position label above point
    return (
      <text 
        x={x} 
        y={y - 8} 
        fill="#374151" 
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
      >
        {displayValue}
      </text>
    );
  };

  const ChartComponent = type === 'bar' ? BarChart : LineChart;
  const DataComponent = type === 'bar' ? Bar : Line;

  return (
    <div className="card">
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={abbreviateNumberI18n}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          
          {dataKeys.map((key, index) => (
            <DataComponent
              key={key.key}
              type={type === 'line' ? 'monotone' : undefined}
              dataKey={key.key}
              name={key.name}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              strokeWidth={2}
              dot={type === 'line' ? { r: 4 } : undefined}
            >
              <LabelList
                dataKey={key.key}
                content={renderCustomLabel}
                position={type === 'bar' ? 'top' : 'top'}
              />
            </DataComponent>
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
