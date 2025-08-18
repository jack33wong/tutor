'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';

interface TopicData {
  name: string;
  value: number;
  color: string;
  completed: boolean;
}

interface TopicPieChartProps {
  data: TopicData[];
  title: string;
  height?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function TopicPieChart({ data, title, height = 300 }: TopicPieChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-gray-600">Progress: {data.value}%</p>
          <p className="text-gray-600">Status: {data.completed ? 'Completed' : 'In Progress'}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="card h-80 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No topic data available</p>
          <p className="text-sm">Start learning to see your progress!</p>
        </div>
      </div>
    );
  }

  const completedTopics = data.filter(topic => topic.completed).length;
  const totalTopics = data.length;
  const completionRate = Math.round((completedTopics / totalTopics) * 100);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-2xl font-bold text-primary-600">{completionRate}%</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-lg font-bold text-success-600">{completedTopics}</p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Clock className="w-5 h-5 text-warning-600" />
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-lg font-bold text-warning-600">{totalTopics - completedTopics}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
