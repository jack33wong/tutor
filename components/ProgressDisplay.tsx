'use client';

import React, { useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { Trophy, Target, BookOpen, Award, TrendingUp, Calendar } from 'lucide-react';

interface ProgressDisplayProps {
  className?: string;
}

export default function ProgressDisplay({ className = '' }: ProgressDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { userProgress } = useProgress('default-user');
  const { stats, completedQuestions } = userProgress;

  if (stats.totalCompleted === 0) {
    return (
      <div className={`p-3 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-gray-600">
          <Target className="w-4 h-4" />
          <span className="text-sm">No progress yet</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Complete past paper questions to track your progress!
        </p>
      </div>
    );
  }

  const recentQuestions = completedQuestions
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3);

  return (
    <div className={`${className}`}>
      {/* Progress Summary */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Progress: {stats.totalCompleted} questions
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-600 font-medium">
              {stats.completionRate}%
            </div>
          </div>
        </button>

        {showDetails && (
          <div className="mt-3 space-y-2">
            {/* Exam Board Stats */}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <BookOpen className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">By Exam Board:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.byExamBoard).map(([board, count]) => (
                  <span key={board} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {board}: {count}
                  </span>
                ))}
              </div>
            </div>

            {/* Difficulty Stats */}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <Award className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">By Level:</span>
              </div>
              <div className="flex gap-1">
                {stats.byDifficulty['Foundation'] && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Foundation: {stats.byDifficulty['Foundation']}
                  </span>
                )}
                {stats.byDifficulty['Higher'] && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    Higher: {stats.byDifficulty['Higher']}
                  </span>
                )}
              </div>
            </div>

            {/* Category Stats */}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <TrendingUp className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">Top Categories:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.byCategory)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([category, count]) => (
                    <span key={category} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                      {category}: {count}
                    </span>
                  ))}
              </div>
            </div>

            {/* Recent Questions */}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <Calendar className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">Recent:</span>
              </div>
              <div className="space-y-1">
                {recentQuestions.map((question, index) => (
                  <div key={question.questionId} className="text-xs text-gray-600 bg-white p-2 rounded border">
                    <div className="font-medium truncate" title={question.questionText}>
                      {question.questionText.slice(0, 40)}
                      {question.questionText.length > 40 ? '...' : ''}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5">
                      {question.examBoard} {question.year} • {question.marks} marks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

