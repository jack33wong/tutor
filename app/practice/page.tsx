'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { examPapers, ExamQuestion } from '@/data/examPapers';
import DrawingPad from '@/components/DrawingPad';

export default function SingleQuestionPractice() {
  const router = useRouter();
  const allQuestions = useMemo(() => examPapers.flatMap(p => p.questions), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = allQuestions.length > 0 ? allQuestions[currentIndex] : null;
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [hint, setHint] = useState<string>('');
  const [loadingHint, setLoadingHint] = useState(false);

  const checkAnswer = (q: ExamQuestion, a: string) => {
    const normalized = (v: any) => String(v ?? '').trim().toLowerCase();
    if (q.questionType === 'multiple-choice') {
      return normalized(a) === normalized(q.correctAnswer);
    }
    return normalized(a) === normalized(q.correctAnswer);
  };

  const submit = async () => {
    if (!current) return;
    const isCorrect = checkAnswer(current, answer);
    setResult(isCorrect ? 'correct' : 'incorrect');
    if (!isCorrect) {
      await fetchHint(current, answer);
    }
  };

  const fetchHint = async (q: ExamQuestion, a: string) => {
    setLoadingHint(true);
    setHint('');
    try {
      const resp = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          studentAnswer: a,
          options: q.options,
          type: q.questionType,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setHint(data.hint || 'Try breaking the problem into smaller steps and check each carefully.');
      } else {
        setHint('Try breaking the problem into smaller steps and check each carefully.');
      }
    } catch (e) {
      setHint('Try breaking the problem into smaller steps and check each carefully.');
    } finally {
      setLoadingHint(false);
    }
  };

  useEffect(() => {
    // Reset attempt state whenever the index changes
    setResult(null);
    setHint('');
    setAnswer('');
  }, [currentIndex]);

  const nextQuestion = () => {
    setCurrentIndex(prev => (prev + 1) % Math.max(1, allQuestions.length));
  };

  if (!current) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No questions available</h1>
          <button onClick={() => router.push('/')} className="btn-primary">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button onClick={() => router.push('/')} className="btn-secondary flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Single Question Practice</h1>
            <div />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                {current.questionType.replace('-', ' ')}
              </span>
              <span className="text-sm text-gray-500">{current.marks} marks</span>
            </div>
            <p className="text-lg text-gray-900">{current.question}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {current.questionType === 'multiple-choice' ? (
                <div className="space-y-2">
                  {current.options?.map((option, idx) => (
                    <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={answer === option}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              )}

              <div className="mt-4 flex items-center space-x-2">
                <button type="button" onClick={submit} className="btn-primary">Check</button>
                <button type="button" onClick={nextQuestion} className="btn-secondary flex items-center space-x-1">
                  <RotateCcw className="w-4 h-4" />
                  <span>Next Question</span>
                </button>
              </div>

              {result && (
                <div className="mt-4 flex items-center space-x-2">
                  {result === 'correct' ? (
                    <div className="flex items-center text-success-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Correct! Great job.</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-error-600">
                      <XCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Not quite. Try again with the hint.</span>
                    </div>
                  )}
                </div>
              )}

              {result === 'incorrect' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Lightbulb className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">Hint</span>
                  </div>
                  <p className="text-sm text-yellow-800">
                    {loadingHint ? 'Generating hint...' : hint}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Notepad</p>
              <DrawingPad className="h-64 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}


