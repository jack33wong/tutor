'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { examPapers } from '@/data/examPapers';
import { ExamQuestion } from '@/data/examPapers';

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  const exam = examPapers.find(e => e.id === examId);
  
  useEffect(() => {
    if (exam) {
      setTimeLeft(exam.timeLimit * 60); // Convert to seconds
    }
  }, [exam]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isSubmitted]);

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam not found</h1>
          <button 
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowResults(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFlag = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const currentQ = exam.questions[currentQuestion];
  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = exam.questions.length;

  if (showResults) {
    return <ExamResults exam={exam} answers={answers} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Exam</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-600">Question {currentQuestion + 1} of {totalQuestions}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Progress</p>
                <p className="text-lg font-bold text-primary-600">{answeredQuestions}/{totalQuestions}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Time Left</p>
                <p className={`text-lg font-bold ${timeLeft < 300 ? 'text-error-600' : 'text-gray-900'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-primary-600">Q{currentQuestion + 1}</span>
                  <span className="text-sm text-gray-500">{currentQ.marks} marks</span>
                </div>
                <button
                  onClick={() => toggleFlag(currentQuestion)}
                  className={`p-2 rounded-lg transition-colors ${
                    flaggedQuestions.has(currentQuestion)
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              {/* Question */}
              <div className="mb-8">
                <p className="text-lg text-gray-900 mb-4">{currentQ.question}</p>
                
                {/* Answer Input */}
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Your Answer</span>
                    <textarea
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      rows={4}
                      placeholder="Enter your answer here..."
                    />
                  </label>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                  {currentQuestion < totalQuestions - 1 ? (
                    <button
                      onClick={() => setCurrentQuestion(prev => prev + 1)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Exam</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Navigator</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {exam.questions.map((question, index) => {
                  const isAnswered = answers[question.id];
                  const isFlagged = flaggedQuestions.has(index);
                  const isCurrent = index === currentQuestion;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'bg-primary-600 text-white'
                          : isAnswered
                          ? 'bg-success-100 text-success-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } relative`}
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="w-3 h-3 absolute -top-1 -right-1 text-yellow-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-primary-600 rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success-100 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ExamResults({ exam, answers }: { exam: any, answers: Record<string, string> }) {
  const router = useRouter();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const calculateScore = () => {
    let totalScore = 0;
    let totalMarks = 0;
    
    exam.questions.forEach((question: ExamQuestion) => {
      totalMarks += question.marks;
      const userAnswer = answers[question.id];
      if (userAnswer && userAnswer.trim().toLowerCase() === question.correctAnswer.toString().toLowerCase()) {
        totalScore += question.marks;
      }
    });
    
    return { score: totalScore, totalMarks, percentage: (totalScore / totalMarks) * 100 };
  };

  const { score, totalMarks, percentage } = calculateScore();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Exam Results</h1>
            <p className="text-lg text-gray-600">{exam.title}</p>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{score}</p>
              <p className="text-sm text-gray-500">Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalMarks}</p>
              <p className="text-sm text-gray-500">Total Marks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success-600">{percentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Percentage</p>
            </div>
          </div>

          {/* Question Review */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Question Review</h2>
            {exam.questions.map((question: ExamQuestion, index: number) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer && userAnswer.trim().toLowerCase() === question.correctAnswer.toString().toLowerCase();
              
              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Question {index + 1}</h3>
                    <div className="flex items-center space-x-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-success-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-error-600" />
                      )}
                      <span className="text-sm text-gray-500">{question.marks} marks</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{question.question}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {userAnswer || 'No answer provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                      <p className="text-sm text-gray-900 bg-success-50 p-2 rounded">
                        {question.correctAnswer}
                      </p>
                    </div>
                  </div>
                  
                  {question.explanation && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-600 mb-1">Explanation:</p>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Retake Exam
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
