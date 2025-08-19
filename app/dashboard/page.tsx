'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle,
  BarChart3,
  MessageCircle,
  LayoutDashboard,
  Award
} from 'lucide-react';
import { sampleUserProgress } from '@/data/userProgress';
import { examPapers } from '@/data/examPapers';
import ProgressCard from '@/components/ProgressCard';
import ExamCard from '@/components/ExamCard';


export default function Dashboard() {
  const router = useRouter();
  const [userProgress] = useState(sampleUserProgress);

  const recentExam = userProgress.examAttempts[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:flex md:flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard</h2>
          <nav className="space-y-2">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat Interface</span>
            </button>

            <button
              onClick={() => router.push('/past-papers')}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <FileText className="w-4 h-4" />
              <span>Past Papers</span>
            </button>

          </nav>
          
          {/* User Info */}
          <div className="mt-auto space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-sm text-gray-500">Target Grade</p>
                <p className="text-lg font-bold text-primary-600">Grade {userProgress.targetGrade}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 p-4">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back! Let's continue your learning journey.</p>
          </header>

          <div className="flex-1 flex">
            <div className="flex-1 overflow-y-auto p-4">
              {/* Progress Overview */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              >
                <ProgressCard
                  title="Overall Progress"
                  value={userProgress.overallProgress}
                  icon={TrendingUp}
                  color="primary"
                  subtitle="Overall learning progress"
                />
                <ProgressCard
                  title="Study Time"
                  value={Math.round(userProgress.studySessions.reduce((acc, s) => acc + s.duration, 0) / 60)}
                  icon={Clock}
                  color="success"
                  subtitle="hours this week"
                />
                <ProgressCard
                  title="Exam Average"
                  value={Math.round(userProgress.examAttempts.reduce((acc, e) => acc + e.percentage, 0) / userProgress.examAttempts.length)}
                  icon={BarChart3}
                  color="warning"
                  subtitle="% across all exams"
                />
                <ProgressCard
                  title="Current Streak"
                  value={7}
                  icon={CheckCircle}
                  color="success"
                  subtitle="days of study"
                />
              </motion.div>

              {/* Main Content Area */}
              <div className="space-y-8">
                {/* Recent Exam Results */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Recent Exam Results</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => router.push('/past-papers')}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Past Papers</span>
                      </button>
                      
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userProgress.examAttempts.slice(0, 2).map((attempt) => {
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
                </motion.div>
              </div>
            </div>


          </div>
        </main>
      </div>
    </div>
  );
}
