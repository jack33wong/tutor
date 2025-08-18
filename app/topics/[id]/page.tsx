'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Target, 
  Play, 
  CheckCircle,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Calculator,
  Bookmark,
  Share2,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { gcseMathsSyllabus } from '@/data/syllabus';
import { topicContent } from '@/data/topicContent';
import { sampleUserProgress } from '@/data/userProgress';

export default function TopicLearningPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;
  
  const [showHints, setShowHints] = useState<Set<string>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const topic = gcseMathsSyllabus.find(t => t.id === topicId);
  const content = topicContent.find(c => c.topicId === topicId);
  const userProgress = sampleUserProgress;

  if (!topic || !content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Topic not found</h1>
          <button 
            onClick={() => router.push('/topics')}
            className="btn-primary"
          >
            Return to Topics
          </button>
        </div>
      </div>
    );
  }

  const getTopicProgress = () => {
    return userProgress.topics.find(t => t.topicId === topicId);
  };

  const progress = getTopicProgress();

  const toggleHint = (questionId: string) => {
    setShowHints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const checkAnswer = (questionId: string) => {
    const question = content.practiceQuestions.find(q => q.id === questionId);
    const userAnswer = userAnswers[questionId];
    if (!question || !userAnswer) return false;
    
    return userAnswer.trim().toLowerCase() === question.correctAnswer.toString().toLowerCase();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'multiple-choice': return 'bg-blue-100 text-blue-800';
      case 'short-answer': return 'bg-green-100 text-green-800';
      case 'long-answer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/topics')}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Topics</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{topic.name}</h1>
                <p className="text-gray-600">{topic.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`p-2 rounded-lg transition-colors ${
                  bookmarked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                }`}
                title="Bookmark topic"
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Progress</p>
                <p className="text-2xl font-bold text-primary-600">
                  {progress ? progress.completionPercentage : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Objectives */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Learning Objectives</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.learningObjectives.map((objective, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{objective}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Key Concepts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center space-x-2 mb-6">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Key Concepts</h2>
              </div>
              <div className="space-y-6">
                {content.keyConcepts.map((concept) => (
                  <div key={concept.id} className="border-l-4 border-primary-500 pl-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{concept.title}</h3>
                    <p className="text-gray-600 mb-3">{concept.description}</p>
                    
                    {concept.formula && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Formula:</p>
                        <p className="font-mono text-gray-900">{concept.formula}</p>
                      </div>
                    )}
                    
                    {concept.rules && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Rules:</p>
                        <ul className="space-y-1">
                          {concept.rules.map((rule, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                              <span className="text-primary-500">•</span>
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {concept.examples && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Examples:</p>
                        <ul className="space-y-1">
                          {concept.examples.map((example, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                              <span className="text-primary-500">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Worked Examples */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center space-x-2 mb-6">
                <Lightbulb className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Worked Examples</h2>
              </div>
              <div className="space-y-6">
                {content.examples.map((example) => (
                  <div key={example.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">{example.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(example.difficulty)}`}>
                        {example.difficulty}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Question:</p>
                        <p className="text-gray-900">{example.question}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Solution:</p>
                        <p className="text-gray-900 font-medium">{example.solution}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Working:</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-sm text-gray-900 font-mono whitespace-pre-line">{example.working}</pre>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Explanation:</p>
                        <p className="text-gray-700">{example.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Practice Questions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Play className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Practice Questions</h2>
                </div>
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showAnswers ? 'Hide' : 'Show'} Answers</span>
                </button>
              </div>
              
              <div className="space-y-6">
                {content.practiceQuestions.map((question) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getQuestionTypeColor(question.questionType)}`}>
                          {question.questionType.replace('-', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        <span className="text-sm text-gray-500">{question.marks} marks</span>
                      </div>
                      <button
                        onClick={() => toggleHint(question.id)}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Show hints"
                      >
                        <Lightbulb className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-gray-900 mb-4">{question.question}</p>
                    
                    {/* Hints */}
                    {showHints.has(question.id) && question.hints && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Hints
                        </h4>
                        <ul className="space-y-1">
                          {question.hints.map((hint, index) => (
                            <li key={index} className="text-sm text-yellow-700">• {hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Answer Input */}
                    <div className="mb-4">
                      {question.questionType === 'multiple-choice' ? (
                        <div className="space-y-2">
                          {question.options?.map((option, index) => (
                            <label key={index} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name={question.id}
                                value={option}
                                checked={userAnswers[question.id] === option}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={userAnswers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Enter your answer..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      )}
                    </div>
                    
                    {/* Answer Check */}
                    {userAnswers[question.id] && (
                      <div className="mb-4">
                        <button
                          onClick={() => {}} // This would check the answer
                          className="btn-secondary text-sm"
                        >
                          Check Answer
                        </button>
                        {checkAnswer(question.id) && (
                          <div className="mt-2 flex items-center space-x-2 text-success-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Correct!</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Answer Display */}
                    {showAnswers && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                            <p className="text-gray-900 font-medium">{question.correctAnswer}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Explanation:</p>
                            <p className="text-gray-700 text-sm">{question.explanation}</p>
                          </div>
                        </div>
                        {question.working && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-600 mb-1">Working:</p>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <pre className="text-sm text-gray-900 font-mono whitespace-pre-line">{question.working}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Topic Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Topic Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Difficulty</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    topic.difficulty === 'foundation' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {topic.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Study Time</span>
                  <span className="font-medium">{content.estimatedStudyTime} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subtopics</span>
                  <span className="font-medium">{topic.subtopics.length}</span>
                </div>
                {progress && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Your Progress</span>
                    <span className="font-medium">{progress.completionPercentage}%</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Common Mistakes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
                <h3 className="text-lg font-semibold text-gray-900">Common Mistakes</h3>
              </div>
              <ul className="space-y-2">
                {content.commonMistakes.map((mistake, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <span className="text-warning-500">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Study Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="card"
            >
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-success-600" />
                <h3 className="text-lg font-semibold text-gray-900">Study Tips</h3>
              </div>
              <ul className="space-y-2">
                {content.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <span className="text-success-500">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Related Topics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Topics</h3>
              <div className="space-y-2">
                {content.relatedTopics.map((relatedTopicId) => {
                  const relatedTopic = gcseMathsSyllabus.find(t => t.id === relatedTopicId);
                  if (!relatedTopic) return null;
                  
                  return (
                    <button
                      key={relatedTopicId}
                      onClick={() => router.push(`/topics/${relatedTopicId}`)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{relatedTopic.name}</p>
                      <p className="text-sm text-gray-600">{relatedTopic.description}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn-primary flex items-center justify-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Take Topic Quiz</span>
                </button>
                <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download Notes</span>
                </button>
                <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span>Share Topic</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
