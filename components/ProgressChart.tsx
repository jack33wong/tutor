'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Target, Calendar } from 'lucide-react';

interface ProgressData {
  date: string;
  score: number;
  questions: number;
  timeSpent: number;
}

interface ProgressChartProps {
  data: ProgressData[];
  title: string;
  type?: 'line' | 'area';
  height?: number;
}

export default function ProgressChart({ data, title, type = 'line', height = 300 }: ProgressChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{formatDate(label)}</p>
          <p className="text-primary-600">Score: {payload[0].value}%</p>
          <p className="text-gray-600">Questions: {payload[1]?.value || 0}</p>
          <p className="text-gray-600">Time: {payload[2]?.value || 0}m</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="card h-80 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No progress data available yet</p>
          <p className="text-sm">Start studying to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Last 30 days</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        {type === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        ) : (
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#3b82f6" 
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-lg font-bold text-primary-600">
              {Math.round(data.reduce((acc, item) => acc + item.score, 0) / data.length)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Questions</p>
            <p className="text-lg font-bold text-gray-900">
              {data.reduce((acc, item) => acc + item.questions, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Study Time</p>
            <p className="text-lg font-bold text-gray-900">
              {data.reduce((acc, item) => acc + item.timeSpent, 0)}m
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
