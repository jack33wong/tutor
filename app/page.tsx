'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle,
  Play,
  BarChart3
} from 'lucide-react';
import { sampleUserProgress } from '@/data/userProgress';
import { gcseMathsSyllabus } from '@/data/syllabus';
import { examPapers } from '@/data/examPapers';
import ProgressCard from '@/components/ProgressCard';
import TopicCard from '@/components/TopicCard';
import ExamCard from '@/components/ExamCard';
import RecentActivity from '@/components/RecentActivity';
import StudySessionCard from '@/components/StudySessionCard';

export default function Dashboard() {
  const router = useRouter();
  const [userProgress] = useState(sampleUserProgress);

  const completedTopics = userProgress.topics.filter(t => t.completed).length;
  const totalTopics = userProgress.topics.length;
  const recentExam = userProgress.examAttempts[0];
  const recentSession = userProgress.studySessions[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GCSE Maths Tutor</h1>
              <p className="text-gray-600">Welcome back! Let's continue your learning journey.</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Target Grade</p>
                <p className="text-2xl font-bold text-primary-600">Grade {userProgress.targetGrade}</p>
              </div>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            subtitle={`${completedTopics}/${totalTopics} topics completed`}
          />
          <ProgressCard
            title="Study Time"
            value={Math.round(userProgress.topics.reduce((acc, t) => acc + t.timeSpent, 0) / 60)}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Topics Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Topics</h2>
                <button 
                  onClick={() => router.push('/topics')}
                  className="btn-primary flex items-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>View All</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userProgress.topics.slice(0, 4).map((topicProgress) => {
                  const topic = gcseMathsSyllabus.find(t => t.id === topicProgress.topicId);
                  if (!topic) return null;
                  
                  return (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      progress={topicProgress}
                      onClick={() => router.push(`/topics/${topic.id}`)}
                    />
                  );
                })}
              </div>
            </motion.div>

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
                  <button 
                    onClick={() => router.push('/exams')}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View All</span>
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

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/exams')}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Practice Test</span>
                </button>
                <button 
                  onClick={() => router.push('/topics')}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Continue Learning</span>
                </button>
                <button 
                  onClick={() => router.push('/exams')}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Take Full Exam</span>
                </button>
              </div>
            </motion.div>

            {/* Recent Study Session */}
            {recentSession && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <StudySessionCard session={recentSession} />
              </motion.div>
            )}

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <RecentActivity userProgress={userProgress} />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
