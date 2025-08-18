'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, Target, TrendingUp } from 'lucide-react';

interface BarData {
  name: string;
  value: number;
  target?: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  showTarget?: boolean;
  colorScheme?: 'default' | 'success' | 'warning' | 'error';
}

const COLOR_SCHEMES = {
  default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  success: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d']
};

export default function BarChart({ 
  data, 
  title, 
  xAxisLabel = 'Category', 
  yAxisLabel = 'Value',
  height = 300,
  showTarget = false,
  colorScheme = 'default'
}: BarChartProps) {
  const colors = COLOR_SCHEMES[colorScheme];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-primary-600">Value: {payload[0].value}</p>
          {data.target && (
            <p className="text-gray-600">Target: {data.target}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="card h-80 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No data available</p>
          <p className="text-sm">Start collecting data to see charts!</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const targetValue = showTarget ? Math.max(...data.map(item => item.target || 0)) : 0;
  const yAxisMax = Math.max(maxValue, targetValue) * 1.1;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {showTarget && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Target className="w-4 h-4" />
            <span>Target: {targetValue}</span>
          </div>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            domain={[0, yAxisMax]}
            tickFormatter={(value) => value.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || colors[index % colors.length]} 
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Highest</p>
            <p className="text-lg font-bold text-primary-600">
              {Math.max(...data.map(item => item.value))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average</p>
            <p className="text-lg font-bold text-gray-900">
              {Math.round(data.reduce((acc, item) => acc + item.value, 0) / data.length)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {data.reduce((acc, item) => acc + item.value, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
