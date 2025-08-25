'use client';

import React, { useState, useEffect } from 'react';
import { examPaperService } from '@/services/examPaperService';

interface ExamQuestion {
  id: string;
  question: string;
  examBoard: string;
  year: number;
  paper: string;
  questionNumber: string;
  category: string;
  marks: number;
  difficulty: 'Foundation' | 'Higher' | 'Mixed';
  topic: string;
}

interface NewQuestionForm {
  question: string;
  examBoard: string;
  year: number;
  paper: string;
  questionNumber: string;
  category: string;
  marks: number;
  difficulty: 'Foundation' | 'Higher' | 'Mixed';
  topic: string;
}

export default function ManageExamPapersPage() {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<ExamQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExamBoard, setFilterExamBoard] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<NewQuestionForm>({
    question: '',
    examBoard: '',
    year: new Date().getFullYear(),
    paper: '',
    questionNumber: '',
    category: '',
    marks: 1,
    difficulty: 'Foundation',
    topic: ''
  });
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    byExamBoard: {} as Record<string, number>,
    byYear: {} as Record<number, number>,
    byDifficulty: {} as Record<string, number>,
    byTopic: {} as Record<string, number>
  });

  // Load questions on component mount
  useEffect(() => {
    loadQuestions();
  }, []);

  // Update filtered questions when filters change
  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, filterExamBoard, filterYear, filterDifficulty, filterTopic]);

  // Update stats when questions change
  useEffect(() => {
    updateStats();
  }, [questions]);

  const loadQuestions = async () => {
    try {
      const pastQuestions = await examPaperService.getAllPastExamQuestions();
      setQuestions(pastQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestions([]);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Exam board filter
    if (filterExamBoard) {
      filtered = filtered.filter(q => q.examBoard === filterExamBoard);
    }

    // Year filter
    if (filterYear) {
      filtered = filtered.filter(q => q.year === parseInt(filterYear));
    }

    // Difficulty filter
    if (filterDifficulty) {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }

    // Topic filter
    if (filterTopic) {
      filtered = filtered.filter(q => q.topic === filterTopic);
    }

    setFilteredQuestions(filtered);
  };

  const updateStats = () => {
    const byExamBoard: Record<string, number> = {};
    const byYear: Record<number, number> = {};
    const byDifficulty: Record<string, number> = {};
    const byTopic: Record<string, number> = {};

    questions.forEach(q => {
      byExamBoard[q.examBoard] = (byExamBoard[q.examBoard] || 0) + 1;
      byYear[q.year] = (byYear[q.year] || 0) + 1;
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
      byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
    });

    setStats({
      total: questions.length,
      byExamBoard,
      byYear,
      byDifficulty,
      byTopic
    });
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim() || !newQuestion.examBoard.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const question: ExamQuestion = {
      id: `${newQuestion.examBoard.toLowerCase()}-${newQuestion.year}-${newQuestion.paper.toLowerCase()}-q${newQuestion.questionNumber}`,
      ...newQuestion
    };

    setQuestions([...questions, question]);
    setNewQuestion({
      question: '',
      examBoard: '',
      year: new Date().getFullYear(),
      paper: '',
      questionNumber: '',
      category: '',
      marks: 1,
      difficulty: 'Foundation',
      topic: ''
    });
    setShowAddForm(false);
  };

  const handleEditQuestion = (question: ExamQuestion) => {
    setEditingQuestion(question);
    setNewQuestion({
      question: question.question,
      examBoard: question.examBoard,
      year: question.year,
      paper: question.paper,
      questionNumber: question.questionNumber,
      category: question.category,
      marks: question.marks,
      difficulty: question.difficulty,
      topic: question.topic
    });
    setShowAddForm(true);
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion) return;

    const updatedQuestions = questions.map(q => 
      q.id === editingQuestion.id ? { ...editingQuestion, ...newQuestion } : q
    );

    setQuestions(updatedQuestions);
    setEditingQuestion(null);
    setShowAddForm(false);
    setNewQuestion({
      question: '',
      examBoard: '',
      year: new Date().getFullYear(),
      paper: '',
      questionNumber: '',
      category: '',
      marks: 1,
      difficulty: 'Foundation',
      topic: ''
    });
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `exam-questions-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getUniqueValues = (field: keyof ExamQuestion) => {
    const values = Array.from(new Set(questions.map(q => q[field])));
    return values.sort();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Exam Papers</h1>
          <p className="text-gray-600">Add, edit, and manage GCSE and A-Level exam questions</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exam Boards</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byExamBoard).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Years Covered</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byYear).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Topics</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byTopic).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Board</label>
              <select
                value={filterExamBoard}
                onChange={(e) => setFilterExamBoard(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Boards</option>
                {getUniqueValues('examBoard').map(board => (
                  <option key={board} value={board}>{board}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {getUniqueValues('year').map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                {getUniqueValues('difficulty').map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Topics</option>
                {getUniqueValues('topic').map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterExamBoard('');
                  setFilterYear('');
                  setFilterDifficulty('');
                  setFilterTopic('');
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              ➕ Add New Question
            </button>
            <button
              onClick={exportToJSON}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              📥 Export to JSON
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the full question text..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Board *</label>
                <input
                  type="text"
                  value={newQuestion.examBoard}
                  onChange={(e) => setNewQuestion({...newQuestion, examBoard: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., AQA, Edexcel, OCR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                <input
                  type="number"
                  value={newQuestion.year}
                  onChange={(e) => setNewQuestion({...newQuestion, year: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="2000"
                  max="2030"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paper</label>
                <input
                  type="text"
                  value={newQuestion.paper}
                  onChange={(e) => setNewQuestion({...newQuestion, paper: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Paper 1H, Paper 2F"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Number</label>
                <input
                  type="text"
                  value={newQuestion.questionNumber}
                  onChange={(e) => setNewQuestion({...newQuestion, questionNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1, 2a, 3b"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Algebra, Geometry, Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                <input
                  type="number"
                  value={newQuestion.marks}
                  onChange={(e) => setNewQuestion({...newQuestion, marks: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value as 'Foundation' | 'Higher' | 'Mixed'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Foundation">Foundation</option>
                  <option value="Higher">Higher</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                <input
                  type="text"
                  value={newQuestion.topic}
                  onChange={(e) => setNewQuestion({...newQuestion, topic: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Linear Equations, Area, Probability"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingQuestion(null);
                  setNewQuestion({
                    question: '',
                    examBoard: '',
                    year: new Date().getFullYear(),
                    paper: '',
                    questionNumber: '',
                    category: '',
                    marks: 1,
                    difficulty: 'Foundation',
                    topic: ''
                  });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        )}

        {/* Questions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Board</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={question.question}>
                        {question.question}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.examBoard}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.paper}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.questionNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.marks}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        question.difficulty === 'Foundation' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'Higher' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.topic}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-500">Try adjusting your filters or add a new question.</p>
          </div>
        )}
      </div>
    </div>
  );
}
