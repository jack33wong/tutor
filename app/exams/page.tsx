'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Clock, Target, Play, BarChart3, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { examPapers } from '@/data/examPapers';
import { sampleUserProgress } from '@/data/userProgress';
import ExamCard from '@/components/ExamCard';

export default function ExamsPage() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'foundation' | 'higher'>('all');
  const [selectedYear, setSelectedYear] = useState<'all' | '2023' | '2022' | '2021'>('all');

  const userProgress = sampleUserProgress;

  // Filter exams based on difficulty and year
  const filteredExams = examPapers.filter(exam => {
    const matchesDifficulty = selectedDifficulty === 'all' || exam.difficulty === selectedDifficulty;
    const matchesYear = selectedYear === 'all' || exam.year.toString() === selectedYear;
    return matchesDifficulty && matchesYear;
  });

  const getExamAttempt = (examId: string) => {
    return userProgress.examAttempts.find(attempt => attempt.examId === examId);
  };

  const getAverageScore = () => {
    if (userProgress.examAttempts.length === 0) return 0;
    const totalPercentage = userProgress.examAttempts.reduce((acc, attempt) => acc + attempt.percentage, 0);
    return Math.round(totalPercentage / userProgress.examAttempts.length);
  };

  const getBestScore = () => {
    if (userProgress.examAttempts.length === 0) return 0;
    return Math.round(Math.max(...userProgress.examAttempts.map(attempt => attempt.percentage)));
  };

  const getTotalExamsTaken = () => {
    return userProgress.examAttempts.length;
  };

  const uniqueYears = [...new Set(examPapers.map(exam => exam.year))].sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Exam Papers</h1>
                <p className="text-gray-600">Practice with past papers and track your performance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-primary-600">{getAverageScore()}%</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Difficulty Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedDifficulty('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDifficulty === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Levels ({examPapers.length})
              </button>
              <button
                onClick={() => setSelectedDifficulty('foundation')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDifficulty === 'foundation'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Foundation ({examPapers.filter(e => e.difficulty === 'foundation').length})
              </button>
              <button
                onClick={() => setSelectedDifficulty('higher')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDifficulty === 'higher'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Higher ({examPapers.filter(e => e.difficulty === 'higher').length})
              </button>
            </div>

            {/* Year Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedYear('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedYear === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Years
              </button>
              {uniqueYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year.toString())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedYear === year.toString()
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Exams Taken</p>
                <p className="text-2xl font-bold text-primary-600">{getTotalExamsTaken()}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-success-600">{getAverageScore()}%</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Score</p>
                <p className="text-2xl font-bold text-warning-600">{getBestScore()}%</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Papers</p>
                <p className="text-2xl font-bold text-blue-600">{examPapers.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Available Exams */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Exam Papers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam, index) => {
              const attempt = getExamAttempt(exam.id);
              
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{exam.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">Year {exam.year}</p>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          exam.difficulty === 'foundation' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {exam.difficulty}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {exam.timeLimit}m
                        </div>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Questions</span>
                      <span className="font-medium">{exam.questions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Marks</span>
                      <span className="font-medium">{exam.totalMarks}</span>
                    </div>
                    
                    {attempt ? (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Your Score</span>
                          <span className="font-medium">{attempt.score}/{attempt.totalMarks}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${attempt.percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-500">Percentage</span>
                          <span className="font-medium">{attempt.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => router.push(`/exam/${exam.id}`)}
                        className="w-full btn-primary flex items-center justify-center space-x-2 mt-3"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Exam</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Attempts */}
        {userProgress.examAttempts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Attempts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userProgress.examAttempts.slice(0, 4).map((attempt) => {
                const exam = examPapers.find(e => e.id === attempt.examId);
                if (!exam) return null;
                
                return (
                  <ExamCard
                    key={attempt.examId}
                    exam={exam}
                    attempt={attempt}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
