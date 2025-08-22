'use client';

import React, { useEffect, useRef } from 'react';
import { X, BookOpen, Calendar, Award, Target, ArrowUp, Hash, FileText, Clock, Users } from 'lucide-react';
import { FullExamPaper, FullExamQuestion } from '@/data/fullExamPapers';

interface FullExamPaperViewProps {
  examPaper: FullExamPaper;
  highlightedQuestionIds: string[]; // Changed from highlightedQuestionId to highlightedQuestionIds array
  onClose: () => void;
  questionStatuses?: Record<string, { status: 'asked' | 'wrong' | 'correct'; userAnswer?: string }>; // New prop for question statuses
}

export default function FullExamPaperView({ 
  examPaper, 
  highlightedQuestionIds, // Changed from highlightedQuestionId to highlightedQuestionIds
  onClose,
  questionStatuses = {} // Default to empty object
}: FullExamPaperViewProps) {
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Scroll to first highlighted question when component mounts
  useEffect(() => {
    if (highlightedQuestionIds.length > 0 && questionRefs.current[highlightedQuestionIds[0]]) {
      const element = questionRefs.current[highlightedQuestionIds[0]];
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add highlight effect to first question
        element.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
        }, 3000);
      }
    }
  }, [highlightedQuestionIds]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate exam code based on exam board and year
  const getExamCode = () => {
    const boardCode = examPaper.examBoard === 'AQA' ? 'AQA' : 
                     examPaper.examBoard === 'Edexcel' ? 'EDX' : 
                     examPaper.examBoard === 'OCR' ? 'OCR' : 'UNK';
    const yearCode = examPaper.year.toString().slice(-2);
    const paperCode = examPaper.paper.includes('1') ? '1' : '2';
    const difficultyCode = examPaper.difficulty === 'Foundation' ? 'F' : 'H';
    return `${boardCode} ${yearCode} ${paperCode}${difficultyCode}`;
  };

  // Get subject name
  const getSubjectName = () => {
    return 'Mathematics (GCSE)';
  };

  // Get qualification level
  const getQualificationLevel = () => {
    return 'GCSE (9-1)';
  };

  // Get time allowed
  const getTimeAllowed = () => {
    return examPaper.paper.includes('1') ? '1 hour 30 minutes' : '1 hour 45 minutes';
  };

  // Get question status display
  const getQuestionStatusDisplay = (questionId: string) => {
    const questionStatus = questionStatuses[questionId];
    if (!questionStatus || !questionStatus.status) return null;

    const statusConfig = {
      asked: { text: '❓ Asked', bg: 'bg-yellow-100', textColor: 'text-yellow-800', border: 'border-yellow-200' },
      wrong: { text: '❌ Wrong', bg: 'bg-red-100', textColor: 'text-red-800', border: 'border-red-200' },
      correct: { text: '✅ Correct', bg: 'bg-green-100', textColor: 'text-green-800', border: 'border-green-200' }
    };

    const config = statusConfig[questionStatus.status as keyof typeof statusConfig];
    if (!config) return null; // Return null if status is not recognized

    return (
      <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.textColor} ${config.border}`}>
        {config.text}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen bg-gray-50">
        {/* Enhanced Header */}
        <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3">
            {/* Main Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {examPaper.examBoard} {examPaper.year} {examPaper.paper}
                    </h1>
                    <p className="text-sm text-gray-600">{getSubjectName()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={scrollToTop}
                  className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Scroll to top"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Detailed Paper Information */}
            <div className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Hash className="w-3 h-3 text-blue-600" />
                  <span className="font-medium text-blue-800">{getExamCode()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-3 h-3 text-green-600" />
                  <span className="font-medium text-green-800">{getSubjectName()}</span>
                  <span className="text-gray-500">({getQualificationLevel()})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-purple-600" />
                  <span className="font-medium text-purple-800">{getTimeAllowed()}</span>
                  <span className="text-gray-500">({examPaper.difficulty} Tier)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-3 h-3 text-orange-600" />
                  <span className="font-medium text-orange-800">{examPaper.totalMarks} marks</span>
                  <span className="text-gray-500">(Year {examPaper.year})</span>
                </div>
              </div>
            </div>

            {/* Additional Metadata */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>Exam Date: {examPaper.year} (Sample Paper)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3 h-3" />
                    <span>Target: GCSE Students</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Paper Reference: {examPaper.examBoard}-{examPaper.year}-{examPaper.paper.replace('Paper ', '')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Paper Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Questions */}
          <div className="space-y-8">
            {examPaper.questions.map((question, index) => (
              <div
                key={question.id}
                ref={(el) => {
                  questionRefs.current[question.id] = el;
                }}
                className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ${
                  highlightedQuestionIds.includes(question.id) 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border border-gray-200'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-full font-semibold text-lg relative">
                      {question.questionNumber}
                      {/* Status indicator */}
                      {questionStatuses[question.id] && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          questionStatuses[question.id].status === 'asked' ? 'bg-yellow-400' :
                          questionStatuses[question.id].status === 'wrong' ? 'bg-red-400' :
                          'bg-green-400'
                        }`} title={
                          questionStatuses[question.id].status === 'asked' ? 'Asked' :
                          questionStatuses[question.id].status === 'wrong' ? 'Wrong' :
                          'Correct'
                        }></div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">
                          {question.category}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-sm font-medium text-gray-600">
                          {question.topic}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>ID: {question.id}</span>
                        <span>•</span>
                        <span>Paper: {examPaper.paper}</span>
                        <span>•</span>
                        <span>Board: {examPaper.examBoard}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">
                        {question.marks} mark{question.marks !== 1 ? 's' : ''}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        question.difficulty === 'Foundation' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {question.difficulty} Tier
                      </span>
                    </div>
                    {/* Question Status */}
                    {getQuestionStatusDisplay(question.id) && (
                      <div className="mt-1">
                        {getQuestionStatusDisplay(question.id)}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 text-right">
                      Question {question.questionNumber} of {examPaper.questions.length}
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-lg text-gray-900 leading-relaxed">
                      {question.question}
                    </p>
                  </div>
                </div>

                {/* Answer Space */}
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[120px] bg-gray-50">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">
                        Write your answer here
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                        <span>• Show all working</span>
                        <span>• Use pencil or pen</span>
                        <span>• Diagrams not to scale</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Highlight indicator */}
                {highlightedQuestionIds.includes(question.id) && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 text-center font-medium">
                      ✨ This is a question you've worked on! ✨
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Progress Panel */}
          {Object.keys(questionStatuses).length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-medium text-blue-900 mb-3 text-center flex items-center justify-center">
                  <Target className="w-4 h-4 mr-2 text-blue-600" />
                  Your Progress Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-900">
                      {Object.keys(questionStatuses).length}/{examPaper.questions.length}
                    </div>
                    <div className="text-xs text-blue-700">Questions Attempted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {Object.values(questionStatuses).filter(q => q.status === 'asked').length}
                    </div>
                    <div className="text-xs text-yellow-700">Still Learning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {Object.values(questionStatuses).filter(q => q.status === 'wrong').length}
                    </div>
                    <div className="text-xs text-red-700">Need Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {Object.values(questionStatuses).filter(q => q.status === 'correct').length}
                    </div>
                    <div className="text-xs text-green-700">Mastered</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-blue-700 mb-2">
                    Overall Progress: {Math.round((Object.keys(questionStatuses).length / examPaper.questions.length) * 100)}%
                  </div>
                  <div className="bg-blue-200 rounded-full h-2 mx-auto max-w-md">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(Object.keys(questionStatuses).length / examPaper.questions.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* End of Paper */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8 border-l-4 border-green-500">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                End of Paper
              </h3>
              <p className="text-lg text-gray-600">
                {examPaper.examBoard} {examPaper.year} {examPaper.paper} - {examPaper.difficulty} Tier
              </p>
            </div>
            
            {/* Paper Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-900">{examPaper.totalMarks}</div>
                <div className="text-sm text-blue-700">Total Marks</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-900">{examPaper.questions.length}</div>
                <div className="text-sm text-green-700">Questions</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-900">{getTimeAllowed()}</div>
                <div className="text-sm text-purple-700">Time Allowed</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-900">{Array.from(new Set(examPaper.questions.map(q => q.topic))).length}</div>
                <div className="text-sm text-orange-700">Topics Covered</div>
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3 text-center">Topic Distribution</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from(new Set(examPaper.questions.map(q => q.topic))).map(topic => {
                  const topicQuestions = examPaper.questions.filter(q => q.topic === topic);
                  const topicMarks = topicQuestions.reduce((sum, q) => sum + q.marks, 0);
                  return (
                    <div key={topic} className="text-center p-2 bg-white rounded border">
                      <div className="text-sm font-medium text-gray-900">{topic}</div>
                      <div className="text-xs text-gray-600">
                        {topicQuestions.length} question{topicQuestions.length !== 1 ? 's' : ''} • {topicMarks} marks
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Paper Reference */}
            <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
              <p className="mb-1">
                <strong>Paper Reference:</strong> {examPaper.examBoard}-{examPaper.year}-{examPaper.paper.replace('Paper ', '')}
              </p>
              <p className="mb-1">
                <strong>Exam Code:</strong> {getExamCode()}
              </p>
              <p>
                <strong>Subject:</strong> {getSubjectName()} • <strong>Level:</strong> {getQualificationLevel()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
