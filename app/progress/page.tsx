'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Target, Calendar, BookOpen, Award, TrendingUp, BarChart3, Filter, MessageCircle } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { useExamPapers } from '@/hooks/useExamPapers';
import LeftSidebar from '@/components/LeftSidebar';
import FullExamPaperView from '@/components/FullExamPaperView';

export default function ProgressPage() {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'marks' | 'difficulty'>('date');
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics'>('overview');
  const [overviewSubTab, setOverviewSubTab] = useState<'papers' | 'activity'>('papers');
  const [examPaperGroupBy, setExamPaperGroupBy] = useState<'date' | 'examBoard' | 'year' | 'difficulty' | 'topic'>('date');
  
  // Full exam paper view state
  const [selectedExamPaper, setSelectedExamPaper] = useState<any>(null);
  const [highlightedQuestionIds, setHighlightedQuestionIds] = useState<string[]>([]); // Changed from highlightedQuestionId to highlightedQuestionIds array

  // Use the new progress hook
  const { 
    userProgress, 
    isLoading, 
    error, 
    loadUserProgress,
    addCompletedQuestion,
    updateQuestionStatus,
    deleteQuestion,
    getFilteredProgress,
    getRecentQuestions
  } = useProgress('default-user');

  // Use the new exam papers hook
  const { 
    fullExamPapers, 
    examPapers, 
    pastExamQuestions,
    isLoading: examPapersLoading,
    error: examPapersError,
    getFullExamPaperByMetadata,
    getFullExamPaperById
  } = useExamPapers();

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
  const handleQuestionClick = async (questionId: string) => {
    console.log('🔍 Question clicked:', questionId);
    
    try {
      // Find the completed question to get its metadata
      const completedQuestion = completedQuestions.find(q => q.questionId === questionId);
      if (!completedQuestion) {
        console.log('❌ Could not find completed question:', questionId);
        return;
      }
      
      console.log('📋 Found completed question:', completedQuestion);
      
      // Try to find exam paper by matching exam board, year, and paper
      const examPaper = await getFullExamPaperByMetadata(
        completedQuestion.examBoard,
        completedQuestion.year,
        completedQuestion.paper
      );
      
      console.log('📄 Found exam paper via metadata:', examPaper);
      
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
      } else {
        console.log('❌ Could not find exam paper for question:', questionId);
        // Show an alert or notification that the exam paper couldn't be found
        alert('Sorry, the full exam paper for this question could not be found. This might be a new question that hasn\'t been added to the exam papers database yet.');
      }
    } catch (error) {
      console.error('Error finding exam paper:', error);
      alert('Sorry, there was an error finding the exam paper. Please try again.');
    }
  };

  // Function to remove a question from recent activity
  const handleRemoveQuestion = async (questionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the question click
    
    if (confirm('Are you sure you want to remove this question from your progress? This action cannot be undone.')) {
      try {
        // Actually delete the question from Firestore
        await deleteQuestion(questionId);
        console.log('🗑️ Question deleted from progress:', questionId);
      } catch (error) {
        console.error('Error deleting question:', error);
        // Show user-friendly error message
        alert('Failed to delete question. Please try again.');
      }
    }
  };

  // Function to close the exam paper view
  const closeExamPaperView = () => {
    console.log('🚪 Closing exam paper view');
    setSelectedExamPaper(null);
    setHighlightedQuestionIds([]); // Changed from setHighlightedQuestionId to setHighlightedQuestionIds
  };

  // Debug effect to track modal state changes
  useEffect(() => {
    console.log('🎭 Modal state changed - selectedExamPaper:', selectedExamPaper);
    console.log('🎭 Modal state changed - highlightedQuestionIds:', highlightedQuestionIds);
  }, [selectedExamPaper, highlightedQuestionIds]);

  // Debug effect to check data availability
  useEffect(() => {
    console.log('📊 Data check - fullExamPapers length:', fullExamPapers.length);
    console.log('📊 Data check - userProgress completedQuestions length:', userProgress.completedQuestions.length);
    console.log('📊 Data check - first fullExamPaper:', fullExamPapers[0]);
    console.log('📊 Data check - isLoading:', isLoading);
    console.log('📊 Data check - error:', error);
    console.log('📊 Data check - userProgress:', userProgress);
    console.log('📊 Data check - examPapersLoading:', examPapersLoading);
    console.log('📊 Data check - examPapersError:', examPapersError);
  }, [fullExamPapers.length, userProgress.completedQuestions.length, isLoading, error, examPapersLoading, examPapersError]);

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex h-screen">
          {/* Left Sidebar */}
          <LeftSidebar>
            {/* Progress Display */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 px-1">Progress Overview</h3>
              <div className="space-y-2">
                <div className="text-xs text-gray-500 px-1">
                  Loading progress data...
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

              {/* Loading State */}
              <div className="bg-gray-900 rounded-lg shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-100 mb-2">Loading Progress Data</h2>
                <p className="text-gray-300">
                  Please wait while we load your progress information...
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex h-screen">
          {/* Left Sidebar */}
          <LeftSidebar>
            {/* Progress Display */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 px-1">Progress Overview</h3>
              <div className="space-y-2">
                <div className="text-xs text-gray-500 px-1">
                  Error loading data
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

              {/* Error State */}
              <div className="bg-gray-900 rounded-lg shadow-sm p-12 text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-gray-100 mb-2">Error Loading Progress</h2>
                <p className="text-gray-300 mb-4">
                  There was an error loading your progress data.
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Error: {error}
                </p>
                <button 
                  onClick={() => loadUserProgress()}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (stats.totalCompleted === 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex h-screen">
          {/* Left Sidebar */}
          <LeftSidebar>
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
              <div className="bg-gray-900 rounded-lg shadow-sm p-12 text-center">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-100 mb-2">No Progress Yet</h2>
                <p className="text-gray-300 mb-6">
                  Start practicing past paper questions to track your progress and see detailed statistics.
                </p>
                <Link 
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
    <div className="min-h-screen bg-black">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <LeftSidebar>
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
              <h1 className="text-3xl font-bold text-gray-100">Progress Tracker</h1>
              <p className="text-gray-300 mt-2">Track your past paper practice and exam preparation</p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <nav className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-gray-900 text-gray-100 shadow-sm'
                      : 'text-gray-300 hover:text-gray-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-gray-900 text-gray-100 shadow-sm'
                      : 'text-gray-300 hover:text-gray-100'
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
                  <div className="bg-gray-900 rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <Trophy className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Total Completed</p>
                        <p className="text-2xl font-bold text-gray-100">{stats.totalCompleted}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-100">{stats.completionRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BookOpen className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Exam Boards</p>
                        <p className="text-2xl font-bold text-gray-100">{Object.keys(stats.byExamBoard).length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Topics Covered</p>
                        <p className="text-2xl font-bold text-gray-100">{Object.keys(stats.byTopic).length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overview Sub-tabs */}
                <div className="bg-gray-900 rounded-lg shadow-sm">
                  <div className="border-b border-gray-700">
                    <nav className="flex space-x-8 px-6">
                      <button
                        onClick={() => setOverviewSubTab('papers')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          overviewSubTab === 'papers'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                        }`}
                      >
                        Recent Exam Papers
                      </button>
                      <button
                        onClick={() => setOverviewSubTab('activity')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          overviewSubTab === 'activity'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                        }`}
                      >
                        Recent Questions
                      </button>
                    </nav>
                  </div>

                  <div className="p-6">
                    {/* Recent Exam Papers Tab */}
                    {overviewSubTab === 'papers' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <BookOpen className="w-5 h-5 mr-2" />
                            Recent Exam Papers
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Group by:</span>
                            <select
                              value={examPaperGroupBy}
                              onChange={(e) => {
                                const groupBy = e.target.value as 'date' | 'examBoard' | 'year' | 'difficulty' | 'topic';
                                setExamPaperGroupBy(groupBy);
                              }}
                              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="date">Date</option>
                              <option value="examBoard">Exam Board</option>
                              <option value="year">Year</option>
                              <option value="difficulty">Difficulty</option>
                              <option value="topic">Topic</option>
                            </select>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Track your progress: ❓ Asked • ❌ Wrong • ✅ Correct
                        </p>
                        {(() => {
                          // Get unique exam papers from completed questions with better deduplication
                          const examPaperMap = new Map<string, {
                            examBoard: string;
                            year: number;
                            paper: string;
                            topics: Set<string>;
                            difficulties: Set<string>;
                            questionCount: number;
                            lastAttempted: number;
                          }>();

                          userProgress.completedQuestions.forEach(q => {
                            // Create a unique key for each exam paper
                            const paperKey = `${q.examBoard}-${q.year}-${q.paper}`;
                            
                            if (examPaperMap.has(paperKey)) {
                              // Update existing entry
                              const existing = examPaperMap.get(paperKey)!;
                              existing.topics.add(q.topic);
                              existing.difficulties.add(q.difficulty);
                              existing.questionCount += 1;
                              existing.lastAttempted = Math.max(existing.lastAttempted, new Date(q.completedAt).getTime());
                            } else {
                              // Create new entry
                              examPaperMap.set(paperKey, {
                                examBoard: q.examBoard,
                                year: q.year,
                                paper: q.paper,
                                topics: new Set([q.topic]),
                                difficulties: new Set([q.difficulty]),
                                questionCount: 1,
                                lastAttempted: new Date(q.completedAt).getTime()
                              });
                            }
                          });

                          // Convert map to array and prepare for grouping
                          const examPapers = Array.from(examPaperMap.values()).map((paper, index) => {
                            // Find the full exam paper to get total question count
                            const fullPaper = fullExamPapers.find(ep => 
                              ep.examBoard === paper.examBoard && 
                              ep.year === paper.year && 
                              ep.paper === paper.paper
                            );
                            
                            // Calculate completion rate
                            const totalQuestions = fullPaper ? fullPaper.questions.length : 0;
                            const completionRate = totalQuestions > 0 ? Math.round((paper.questionCount / totalQuestions) * 100) : 0;
                            
                            return {
                              ...paper,
                              id: index,
                              totalQuestions,
                              completionRate,
                              // Get the most common difficulty (or first if tied)
                              difficulty: Array.from(paper.difficulties).sort((a, b) => 
                                Array.from(paper.difficulties).filter(d => d === b).length - 
                                Array.from(paper.difficulties).filter(d => d === a).length
                              )[0] || 'Foundation',
                              // Get the most common topic (or first if tied)
                              topic: Array.from(paper.topics).sort((a, b) => 
                                Array.from(paper.topics).filter(t => t === b).length - 
                                Array.from(paper.topics).filter(t => t === a).length
                              )[0] || 'Algebra'
                            };
                          });

                          // Get grouping preference from React state
                          const groupBy = examPaperGroupBy;

                          if (examPapers.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No exam papers attempted yet</p>
                                <p className="text-sm text-gray-400 mt-1">Start practicing questions to see your exam papers here</p>
                              </div>
                            );
                          }

                          // Group the papers based on selection
                          let groupedPapers: { [key: string]: typeof examPapers } = {};
                          
                          if (groupBy === 'examBoard') {
                            examPapers.forEach(paper => {
                              const key = paper.examBoard;
                              if (!groupedPapers[key]) groupedPapers[key] = [];
                              groupedPapers[key].push(paper);
                            });
                          } else if (groupBy === 'year') {
                            examPapers.forEach(paper => {
                              const key = paper.year.toString();
                              if (!groupedPapers[key]) groupedPapers[key] = [];
                              groupedPapers[key].push(paper);
                            });
                          } else if (groupBy === 'difficulty') {
                            examPapers.forEach(paper => {
                              const key = paper.difficulty;
                              if (!groupedPapers[key]) groupedPapers[key] = [];
                              groupedPapers[key].push(paper);
                            });
                          } else if (groupBy === 'topic') {
                            examPapers.forEach(paper => {
                              const key = paper.topic;
                              if (!groupedPapers[key]) groupedPapers[key] = [];
                              groupedPapers[key].push(paper);
                            });
                          } else {
                            // Default: group by date (no grouping, just sort)
                            groupedPapers = { 'Recent': examPapers.sort((a, b) => b.lastAttempted - a.lastAttempted) };
                          }

                          // Sort groups and papers within groups
                          const sortedGroups = Object.keys(groupedPapers).sort((a, b) => {
                            if (groupBy === 'year') return parseInt(b) - parseInt(a);
                            if (groupBy === 'date') return 0;
                            return a.localeCompare(b);
                          });

                          return (
                            <div className="space-y-6">
                              {sortedGroups.map((groupKey) => {
                                const papers = groupedPapers[groupKey];
                                // Sort papers within each group
                                const sortedPapers = papers.sort((a, b) => b.lastAttempted - a.lastAttempted);

                                return (
                                  <div key={groupKey} className="space-y-3">
                                    {/* Group Header */}
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <h4 className="font-medium text-gray-700 capitalize">
                                        {groupBy === 'year' ? `${groupKey} Papers` : 
                                         groupBy === 'examBoard' ? `${groupKey} Exam Board` :
                                         groupBy === 'difficulty' ? `${groupKey} Level` :
                                         groupBy === 'topic' ? `${groupKey} Topic` :
                                         groupKey}
                                      </h4>
                                      <span className="text-sm text-gray-500">({papers.length})</span>
                                    </div>
                                    
                                    {/* Papers in this group */}
                                    <div className="space-y-3 ml-4">
                                      {sortedPapers.map((paper) => (
                                        <div 
                                          key={paper.id}
                                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                                          onClick={() => {
                                            console.log('📄 Exam paper clicked:', paper);
                                            // Find questions from this exam paper and highlight them
                                            const paperQuestions = userProgress.completedQuestions.filter(q => 
                                              q.examBoard === paper.examBoard && 
                                              q.year === paper.year && 
                                              q.paper === paper.paper
                                            );
                                            const questionIds = paperQuestions.map(q => q.questionId);
                                            console.log('🔍 Found questions:', questionIds);
                                            setHighlightedQuestionIds(questionIds);
                                            
                                            // Find and open the exam paper
                                            getFullExamPaperByMetadata(paper.examBoard, paper.year, paper.paper)
                                              .then(examPaper => {
                                                console.log('📋 Found exam paper:', examPaper);
                                                if (examPaper) {
                                                  console.log('✅ Setting selected exam paper');
                                                  setSelectedExamPaper(examPaper);
                                                } else {
                                                  console.log('❌ Exam paper not found in Firestore');
                                                  alert('Sorry, the full exam paper could not be found. This might be a new exam paper that hasn\'t been added to the database yet.');
                                                }
                                              })
                                              .catch(error => {
                                                console.error('Error finding exam paper:', error);
                                                alert('Sorry, there was an error finding the exam paper. Please try again.');
                                              });
                                          }}
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                              <h4 className="font-medium text-gray-900">
                                                {paper.examBoard} {paper.year} {paper.paper}
                                              </h4>
                                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                                paper.difficulty === 'Foundation' ? 'bg-green-100 text-green-800' :
                                                paper.difficulty === 'Higher' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                              }`}>
                                                {paper.difficulty}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                                {paper.topics.size > 1 ? `${paper.topics.size} topics` : paper.topic}
                                              </span>
                                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                {paper.questionCount} questions
                                              </span>
                                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                                                {paper.completionRate}% complete
                                              </span>
                                              <span className="text-gray-500">
                                                {new Date(paper.lastAttempted).toLocaleDateString('en-GB')}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end space-y-2">
                                            {/* Progress Bar */}
                                            <div className="text-right">
                                              <div className="text-xs text-gray-500 mb-1">
                                                {paper.questionCount}/{paper.totalQuestions}
                                              </div>
                                              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                                <div 
                                                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                                  style={{ width: `${paper.completionRate}%` }}
                                                ></div>
                                              </div>
                                            </div>
                                            <span className="text-sm text-gray-500 group-hover:text-gray-700">
                                              View Paper →
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                        <div className="mt-4 text-center">
                          <p className="text-xs text-gray-500">
                            💡 Click on any exam paper to view the full paper with your progress
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Recent Questions Tab */}
                                          {overviewSubTab === 'activity' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          Recent Questions
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Track your progress: ❓ Asked • ❌ Wrong • ✅ Correct
                        </p>
                        <div className="space-y-3">
                          {sortedQuestions.slice(0, 5).map((question) => (
                            <div 
                              key={question.questionId} 
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                              onClick={() => {
                                console.log('🔍 Question clicked:', question);
                                handleQuestionClick(question.questionId);
                              }}
                            >
                                                             <div className="flex-1">
                                 <p className="text-sm font-medium text-gray-900">{question.questionText.substring(0, 60)}...</p>
                                 <p className="text-xs text-gray-600">
                                   {question.examBoard && question.examBoard !== 'Unknown' ? question.examBoard : 'General'} • {question.year} • {question.topic}
                                 </p>
                                {/* Question Status */}
                                <div className="mt-1">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                    (question.status || 'asked') === 'asked' ? 'bg-yellow-100 text-yellow-800' :
                                    (question.status || 'asked') === 'wrong' ? 'bg-red-100 text-red-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {question.status === 'asked' ? '❓ Asked' : 
                                     question.status === 'wrong' ? '❌ Wrong' : 
                                     '✅ Correct'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  {question.marks} marks
                                </span>
                                <button
                                  onClick={(e) => handleRemoveQuestion(question.questionId, e)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  title="Remove question from progress"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
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
                    )}
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

      {/* Test Modal for Debugging */}
      {selectedExamPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Test Modal - Exam Paper Found!</h3>
            <p className="mb-4">
              <strong>Exam Board:</strong> {selectedExamPaper.examBoard}<br/>
              <strong>Year:</strong> {selectedExamPaper.year}<br/>
              <strong>Paper:</strong> {selectedExamPaper.paper}
            </p>
            <button
              onClick={() => setSelectedExamPaper(null)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Close Test Modal
            </button>
          </div>
        </div>
      )}

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
