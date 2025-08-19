'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  Target, 
  Play, 
  BarChart3, 
  Calendar,
  Calculator,
  BookOpen,
  Award,
  TrendingUp,
  Filter,
  MessageCircle,
  LayoutDashboard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { examPapers } from '@/data/examPapers';
import { sampleUserProgress } from '@/data/userProgress';

export default function PastPapersPage() {
  const router = useRouter();
  const [selectedExamBoard, setSelectedExamBoard] = useState<'all' | 'AQA' | 'Edexcel' | 'OCR' | 'WJEC'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'foundation' | 'higher'>('all');
  const [selectedYear, setSelectedYear] = useState<'all' | string>('all');
  const [selectedCalculator, setSelectedCalculator] = useState<'all' | 'calculator' | 'non-calculator'>('all');

  const userProgress = sampleUserProgress;

  // Filter exams based on selected criteria
  const filteredExams = examPapers.filter(exam => {
    const matchesBoard = selectedExamBoard === 'all' || exam.examBoard === selectedExamBoard;
    const matchesDifficulty = selectedDifficulty === 'all' || exam.difficulty === selectedDifficulty;
    const matchesYear = selectedYear === 'all' || exam.year.toString() === selectedYear;
    const matchesCalculator = selectedCalculator === 'all' || 
      (selectedCalculator === 'calculator' && exam.calculator) ||
      (selectedCalculator === 'non-calculator' && !exam.calculator);
    
    return matchesBoard && matchesDifficulty && matchesYear && matchesCalculator;
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

  const uniqueYears = Array.from(new Set(examPapers.map(exam => exam.year))).sort((a, b) => b - a);
  const uniqueExamBoards = Array.from(new Set(examPapers.map(exam => exam.examBoard)));

  const examBoardColors = {
    'AQA': 'bg-blue-100 text-blue-800',
    'Edexcel': 'bg-green-100 text-green-800',
    'OCR': 'bg-purple-100 text-purple-800',
    'WJEC': 'bg-orange-100 text-orange-800'
  };

  const difficultyColors = {
    'foundation': 'bg-blue-100 text-blue-800',
    'higher': 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:flex md:flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Papers</h2>
          <nav className="space-y-2">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat Interface</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </nav>
          
          {/* User Info */}
          <div className="mt-auto space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-lg font-bold text-primary-600">{getAverageScore()}%</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 p-4">
            <h1 className="text-xl font-bold text-gray-900">Past Papers</h1>
            <p className="text-sm text-gray-600">Practice with authentic GCSE Maths exam papers</p>
          </header>

                    <div className="flex-1 overflow-y-auto p-4">
        {/* Filters */}
        <div className="mb-8">
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter Papers</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Exam Board Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Board</label>
                <select
                  value={selectedExamBoard}
                  onChange={(e) => setSelectedExamBoard(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Boards</option>
                  {uniqueExamBoards.map(board => (
                    <option key={board} value={board}>{board}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Levels</option>
                  <option value="foundation">Foundation</option>
                  <option value="higher">Higher</option>
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Years</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Calculator Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calculator</label>
                <select
                  value={selectedCalculator}
                  onChange={(e) => setSelectedCalculator(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Papers</option>
                  <option value="calculator">Calculator</option>
                  <option value="non-calculator">Non-Calculator</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Showing {filteredExams.length} of {examPapers.length} papers
              </p>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Papers Taken</p>
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
                <Award className="w-6 h-6 text-warning-600" />
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

        {/* Available Papers */}
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
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${examBoardColors[exam.examBoard]}`}>
                          {exam.examBoard}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyColors[exam.difficulty]}`}>
                          {exam.difficulty}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {exam.paperType}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          exam.calculator ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {exam.calculator ? 'Calculator' : 'Non-Calculator'}
                        </span>
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
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Time Limit</span>
                      <span className="font-medium">{exam.timeLimit}m</span>
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
                        <div className="mt-2 flex items-center justify-center">
                          <span className="text-xs text-gray-500">Completed on {new Date(attempt.date).toLocaleDateString('en-GB')}</span>
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
                  <div key={attempt.examId} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{exam.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {exam.examBoard} • {exam.difficulty} • {new Date(attempt.date).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">{attempt.percentage.toFixed(1)}%</p>
                        <p className="text-sm text-gray-500">{attempt.score}/{attempt.totalMarks}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{attempt.timeSpent}m</span>
                      </div>
                      <button
                        onClick={() => router.push(`/exam/${exam.id}`)}
                        className="btn-secondary text-sm"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Study Tips */}
        <div className="mt-8">
          <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Tips for Success
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Before the Exam</h4>
                <ul className="space-y-1">
                  <li>• Review the syllabus topics covered</li>
                  <li>• Practice similar questions from past papers</li>
                  <li>• Ensure you have the right equipment (calculator if allowed)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">During the Exam</h4>
                <ul className="space-y-1">
                  <li>• Read each question carefully</li>
                  <li>• Show your working for full marks</li>
                  <li>• Manage your time effectively</li>
                </ul>
              </div>
            </div>
          </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
