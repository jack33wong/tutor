'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Function, Target, Grid3X3 } from 'lucide-react';
import { useState } from 'react';

interface MathGraphProps {
  title: string;
  functionType: 'linear' | 'quadratic' | 'cubic' | 'exponential' | 'trigonometric';
  height?: number;
  showGrid?: boolean;
  showPoints?: boolean;
  domain?: { x: [number, number]; y: [number, number] };
}

export default function MathGraph({ 
  title, 
  functionType, 
  height = 300, 
  showGrid = true,
  showPoints = true,
  domain = { x: [-10, 10], y: [-10, 10] }
}: MathGraphProps) {


  const generateData = () => {
    const data = [];
    const step = 0.1;
    
    for (let x = domain.x[0]; x <= domain.x[1]; x += step) {
      let y: number;
      
      switch (functionType) {
        case 'linear':
          y = 2 * x + 1; // y = 2x + 1
          break;
        case 'quadratic':
          y = x * x - 4; // y = x² - 4
          break;
        case 'cubic':
          y = x * x * x - 2 * x; // y = x³ - 2x
          break;
        case 'exponential':
          y = Math.pow(2, x); // y = 2^x
          break;
        case 'trigonometric':
          y = 3 * Math.sin(x); // y = 3sin(x)
          break;
        default:
          y = x;
      }
      
      // Only include points within y domain
      if (y >= domain.y[0] && y <= domain.y[1]) {
        data.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
      }
    }
    
    return data;
  };

  const data = generateData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">Point ({label}, {payload[0].value})</p>
          <p className="text-sm text-gray-600">
            Function: {functionType === 'linear' && 'y = 2x + 1'}
            {functionType === 'quadratic' && 'y = x² - 4'}
            {functionType === 'cubic' && 'y = x³ - 2x'}
            {functionType === 'exponential' && 'y = 2^x'}
            {functionType === 'trigonometric' && 'y = 3sin(x)'}
          </p>
        </div>
      );
    }
    return null;
  };

  const getFunctionDescription = () => {
    switch (functionType) {
      case 'linear':
        return 'y = 2x + 1 (Linear function with gradient 2 and y-intercept 1)';
      case 'quadratic':
        return 'y = x² - 4 (Parabola opening upwards, vertex at (0, -4))';
      case 'cubic':
        return 'y = x³ - 2x (Cubic function with turning points)';
      case 'exponential':
        return 'y = 2^x (Exponential growth function)';
      case 'trigonometric':
        return 'y = 3sin(x) (Sine function with amplitude 3)';
      default:
        return '';
    }
  };

  const getKeyFeatures = () => {
    switch (functionType) {
      case 'linear':
        return ['Gradient: 2', 'Y-intercept: (0, 1)', 'X-intercept: (-0.5, 0)'];
      case 'quadratic':
        return ['Vertex: (0, -4)', 'X-intercepts: (-2, 0) and (2, 0)', 'Axis of symmetry: x = 0'];
      case 'cubic':
        return ['Turning points at x ≈ ±0.82', 'X-intercepts: (0, 0), (±√2, 0)', 'Point of inflection at (0, 0)'];
      case 'exponential':
        return ['Always positive', 'Passes through (0, 1)', 'Rapidly increasing'];
      case 'trigonometric':
        return ['Amplitude: 3', 'Period: 2π', 'Range: [-3, 3]'];
      default:
        return [];
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Function className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Grid3X3 className="w-4 h-4" />
          <span>{functionType}</span>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">{getFunctionDescription()}</p>
        <div className="flex flex-wrap gap-2">
          {getKeyFeatures().map((feature, index) => (
            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {feature}
            </span>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          
          {/* X and Y axes */}
          <XAxis 
            dataKey="x" 
            stroke="#6b7280"
            fontSize={12}
            domain={domain.x}
            tickFormatter={(value) => value.toFixed(1)}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            domain={domain.y}
            tickFormatter={(value) => value.toFixed(1)}
          />
          
          {/* Reference lines */}
          <ReferenceLine x={0} stroke="#d1d5db" strokeDasharray="3 3" />
          <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="3 3" />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Line 
            type="monotone" 
            dataKey="y" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={showPoints ? { fill: '#3b82f6', strokeWidth: 1, r: 2 } : false}
            activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Domain</p>
            <p className="text-sm font-medium text-gray-900">
              [{domain.x[0]}, {domain.x[1]}]
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Range</p>
            <p className="text-sm font-medium text-gray-900">
              [{domain.y[0]}, {domain.y[1]}]
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Points</p>
            <p className="text-sm font-medium text-gray-900">
              {data.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
