'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Target, Calendar, BookOpen, Award, TrendingUp, BarChart3, Filter, MessageCircle } from 'lucide-react';
import { UserProgress, calculateProgressStats, getQuestionStatus } from '@/data/progressTracking';
import LeftSidebar from '@/components/LeftSidebar';
import FullExamPaperView from '@/components/FullExamPaperView';
import { findExamPaperByQuestionId, fullExamPapers } from '@/data/fullExamPapers';

export default function ProgressPage() {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedQuestions: [],
    stats: calculateProgressStats([]),
    lastUpdated: new Date()
  });
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'marks' | 'difficulty'>('date');
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics'>('overview');
  
  // Full exam paper view state
  const [selectedExamPaper, setSelectedExamPaper] = useState<any>(null);
  const [highlightedQuestionIds, setHighlightedQuestionIds] = useState<string[]>([]); // Changed from highlightedQuestionId to highlightedQuestionIds array

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProgress = localStorage.getItem('userProgress');
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          
          // Migrate existing data to include status field
          const migratedProgress = {
            ...parsed,
            completedQuestions: parsed.completedQuestions?.map((q: any) => ({
              ...q,
              status: q.status || 'asked' // Default to 'asked' for existing questions
            })) || []
          };
          
          setUserProgress(migratedProgress);
          
          // Save migrated data back to localStorage
          localStorage.setItem('userProgress', JSON.stringify(migratedProgress));
        }
      } catch (error) {
        console.error('Error loading user progress:', error);
      }
    }
  }, []);

  const { stats, completedQuestions } = userProgress;

  // Filter and sort questions
  const filteredQuestions = completedQuestions.filter(question => {
    if (filter === 'all') return true;
    if (filter === 'foundation') return question.difficulty === 'Foundation';
    if (filter === 'higher') return question.difficulty === 'Higher';
    return question.examBoard.toLowerCase().includes(filter.toLowerCase());
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      case 'marks':
        return b.marks - a.marks;
      case 'difficulty':
        return a.difficulty.localeCompare(b.difficulty);
      default:
        return 0;
    }
  });

  const examBoards = Array.from(new Set(completedQuestions.map(q => q.examBoard)));

  // Function to handle clicking on a recent activity question
  const handleQuestionClick = (questionId: string) => {
    console.log('🔍 Question clicked:', questionId);
    const examPaper = findExamPaperByQuestionId(questionId);
    console.log('📄 Found exam paper:', examPaper);
    if (examPaper) {
      // Find all completed questions from this exam paper
      const examPaperCompletedQuestions = completedQuestions.filter(question => {
        // Match by exam board, year, and paper
        return question.examBoard === examPaper.examBoard && 
               question.year === examPaper.year && 
               question.paper === examPaper.paper;
      });
      
      // Extract the question IDs that match the full exam paper question IDs
      const matchingQuestionIds = examPaperCompletedQuestions
        .map(completedQ => completedQ.questionId)
        .filter(id => examPaper.questions.some(paperQ => paperQ.id === id));
      
      console.log('✅ Found completed questions from this exam paper:', matchingQuestionIds);
      
      setSelectedExamPaper(examPaper);
      setHighlightedQuestionIds(matchingQuestionIds);
      console.log('✅ Exam paper view opened with highlighted questions:', matchingQuestionIds);
    } else {
      console.log('❌ No exam paper found for question:', questionId);
      console.log('🔍 Available question IDs in fullExamPapers:');
      console.log('📚 Full exam papers:', fullExamPapers);
    }
  };

  // Function to close the exam paper view
  const closeExamPaperView = () => {
    setSelectedExamPaper(null);
    setHighlightedQuestionIds([]); // Changed from setHighlightedQuestionId to setHighlightedQuestionIds
  };

  if (stats.totalCompleted === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Left Sidebar */}
          <LeftSidebar userProgress={userProgress}>
            {/* Progress Display */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 px-1">Progress Overview</h3>
              <div className="space-y-2">
                <div className="text-xs text-gray-500 px-1">
                  No progress data yet. Start practicing questions to see your statistics here.
                </div>
              </div>
            </div>
          </LeftSidebar>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Progress Tracker</h1>
                <p className="text-gray-600 mt-2">Track your past paper practice and exam preparation</p>
              </div>

              {/* Empty State */}
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Progress Yet</h2>
                <p className="text-gray-600 mb-6">
                  Start practicing past paper questions to track your progress and see detailed statistics.
                </p>
                <Link 
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Practicing
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <LeftSidebar userProgress={userProgress}>
          {/* Progress Display */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 px-1">Progress Overview</h3>
            <div className="space-y-2">
              <div className="text-xs text-gray-500 px-1">
                Total Completed: {stats.totalCompleted}
              </div>
              <div className="text-xs text-gray-500 px-1">
                Completion Rate: {stats.completionRate}%
              </div>
              <div className="text-xs text-gray-500 px-1">
                Exam Boards: {Object.keys(stats.byExamBoard).length}
              </div>
            </div>
          </div>
        </LeftSidebar>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Progress Tracker</h1>
              <p className="text-gray-600 mt-2">Track your past paper practice and exam preparation</p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'history'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>

              </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Trophy className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Completed</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalCompleted}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BookOpen className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Exam Boards</p>
                        <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byExamBoard).length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Topics Covered</p>
                        <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byTopic).length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {sortedQuestions.slice(0, 5).map((question) => (
                      <div 
                        key={question.questionId} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleQuestionClick(question.questionId)}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{question.questionText.substring(0, 60)}...</p>
                          <p className="text-xs text-gray-600">
                            {question.examBoard} • {question.year} • {question.topic}
                          </p>
                          {/* Question Status */}
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                              (question.status || 'asked') === 'asked' ? 'bg-yellow-100 text-yellow-800' :
                              (question.status || 'asked') === 'wrong' ? 'bg-red-100 text-red-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {getQuestionStatus(question)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {question.marks} marks
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      💡 Click on any question above to view the full exam paper
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* Filters and Controls */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Filter:</span>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Questions</option>
                        <option value="foundation">Foundation</option>
                        <option value="higher">Higher</option>
                        {examBoards.map(board => (
                          <option key={board} value={board}>{board}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'marks' | 'difficulty')}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="date">Date</option>
                        <option value="marks">Marks</option>
                        <option value="difficulty">Difficulty</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Question History ({sortedQuestions.length})</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Track your progress: ❓ Asked • ❌ Wrong • ✅ Correct
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {sortedQuestions.map((question) => (
                      <div 
                        key={question.questionId} 
                        className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleQuestionClick(question.questionId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 mb-2">{question.questionText}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                {question.examBoard}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                                {question.year}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                {question.topic}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                {question.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Paper: {question.paper} • Question: {question.questionNumber} • Marks: {question.marks}
                            </p>
                            {/* Question Status */}
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                (question.status || 'asked') === 'asked' ? 'bg-yellow-100 text-yellow-800' :
                                (question.status || 'asked') === 'wrong' ? 'bg-red-100 text-red-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {getQuestionStatus(question)}
                              </span>
                            </div>
                            {question.userAnswer && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 mb-1">Your Answer:</p>
                                <p className="text-sm text-gray-600">{question.userAnswer}</p>
                                {(question.status || 'asked') === 'correct' && (
                                  <p className="text-sm text-green-600 mt-1">✅ Correct!</p>
                                )}
                                {(question.status || 'asked') === 'wrong' && (
                                  <p className="text-sm text-red-600 mt-1">❌ Incorrect</p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            {new Date(question.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Exam Board Distribution */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Exam Board Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byExamBoard)
                      .sort(([,a], [,b]) => b - a)
                      .map(([board, count]) => (
                        <div key={board} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{board}</span>
                          <div className="flex items-center space-x-2">
                            <div className="bg-gray-200 rounded-full h-2 w-20">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(count / stats.totalCompleted) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Year Distribution */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Year Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byYear)
                      .sort(([a], [b]) => parseInt(b) - parseInt(a))
                      .map(([year, count]) => (
                        <div key={year} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{year}</span>
                          <div className="flex items-center space-x-2">
                            <div className="bg-gray-200 rounded-full h-2 w-20">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${(count / stats.totalCompleted) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Topic Analysis */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Topic Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(stats.byTopic)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 9)
                      .map(([topic, count]) => (
                        <div key={topic} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-900 mb-1">{topic}</div>
                          <div className="text-xs text-gray-600">{count} questions</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}


          </div>
        </main>
      </div>

      {/* Full Exam Paper View Modal */}
      {selectedExamPaper && (
        <FullExamPaperView
          examPaper={selectedExamPaper}
          highlightedQuestionIds={highlightedQuestionIds} // Changed from highlightedQuestionId to highlightedQuestionIds
          onClose={closeExamPaperView}
          questionStatuses={Object.fromEntries(
            completedQuestions
              .filter(q => 
                q.examBoard === selectedExamPaper.examBoard && 
                q.year === selectedExamPaper.year && 
                q.paper === selectedExamPaper.paper
              )
              .map(q => [q.questionId, { 
                status: q.status || 'asked', // Provide default status for existing data
                userAnswer: q.userAnswer 
              }])
          )}
        />
      )}
    </div>
  );
}
