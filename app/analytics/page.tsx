'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sampleUserProgress } from '@/data/userProgress';
import { gcseMathsSyllabus } from '@/data/syllabus';
import ProgressChart from '@/components/ProgressChart';
import TopicPieChart from '@/components/TopicPieChart';
import BarChart from '@/components/BarChart';
import MathGraph from '@/components/MathGraph';

export default function AnalyticsPage() {
  const router = useRouter();
  const userProgress = sampleUserProgress;

  // Generate sample progress data for the last 30 days
  const generateProgressData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic but varied data
      const baseScore = 65 + Math.random() * 25; // 65-90 range
      const questions = Math.floor(Math.random() * 20) + 5; // 5-25 questions
      const timeSpent = Math.floor(Math.random() * 60) + 15; // 15-75 minutes
      
      data.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(baseScore + (Math.random() - 0.5) * 10),
        questions,
        timeSpent
      });
    }
    
    return data;
  };

  // Generate topic performance data
  const generateTopicData = () => {
    return gcseMathsSyllabus.map((topic, index) => {
      const progress = userProgress.topics.find(t => t.topicId === topic.id);
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      
      return {
        name: topic.name,
        value: progress ? progress.completionPercentage : Math.floor(Math.random() * 100),
        color: colors[index % colors.length],
        completed: progress ? progress.completed : Math.random() > 0.5
      };
    });
  };

  // Generate exam performance data
  const generateExamData = () => {
    return userProgress.examAttempts.map((attempt, index) => {
      const exam = gcseMathsSyllabus.find(t => t.id === attempt.examId);
      return {
        name: exam ? exam.name : `Exam ${index + 1}`,
        value: attempt.percentage,
        target: 80 // Target score
      };
    });
  };

  // Generate study time data
  const generateStudyTimeData = () => {
    const topics = ['Number', 'Algebra', 'Geometry', 'Statistics', 'Higher Algebra', 'Higher Geometry'];
    return topics.map((topic, index) => ({
      name: topic,
      value: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index]
    }));
  };

  const progressData = generateProgressData();
  const topicData = generateTopicData();
  const examData = generateExamData();
  const studyTimeData = generateStudyTimeData();

  const totalStudyTime = studyTimeData.reduce((acc, item) => acc + item.value, 0);
  const averageScore = Math.round(progressData.reduce((acc, item) => acc + item.score, 0) / progressData.length);
  const completedTopics = topicData.filter(topic => topic.completed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">Visualize your learning progress and performance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Overall Progress</p>
              <p className="text-2xl font-bold text-primary-600">{averageScore}%</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-primary-600">{averageScore}%</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Topics Completed</p>
                <p className="text-2xl font-bold text-success-600">{completedTopics}</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Study Time</p>
                <p className="text-2xl font-bold text-warning-600">{totalStudyTime}m</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Exams Taken</p>
                <p className="text-2xl font-bold text-purple-600">{userProgress.examAttempts.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Progress Over Time */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ProgressChart
              data={progressData}
              title="Progress Over Time"
              type="line"
              height={350}
            />
          </motion.div>

          {/* Topic Performance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <TopicPieChart
              data={topicData}
              title="Topic Performance"
              height={350}
            />
          </motion.div>
        </div>

        {/* More Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Exam Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <BarChart
              data={examData}
              title="Exam Performance"
              xAxisLabel="Exam"
              yAxisLabel="Score (%)"
              height={300}
              showTarget={true}
              colorScheme="success"
            />
          </motion.div>

          {/* Study Time by Topic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <BarChart
              data={studyTimeData}
              title="Study Time by Topic"
              xAxisLabel="Topic"
              yAxisLabel="Time (minutes)"
              height={300}
              colorScheme="default"
            />
          </motion.div>
        </div>

        {/* Mathematical Function Graphs */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mathematical Functions</h2>
            <p className="text-gray-600">Explore different types of mathematical functions and their properties</p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <MathGraph
                title="Linear Function"
                functionType="linear"
                height={300}
                domain={{ x: [-5, 5], y: [-5, 15] }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
            >
              <MathGraph
                title="Quadratic Function"
                functionType="quadratic"
                height={300}
                domain={{ x: [-5, 5], y: [-10, 10] }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
            >
              <MathGraph
                title="Cubic Function"
                functionType="cubic"
                height={300}
                domain={{ x: [-3, 3], y: [-10, 10] }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
            >
              <MathGraph
                title="Trigonometric Function"
                functionType="trigonometric"
                height={300}
                domain={{ x: [-2 * Math.PI, 2 * Math.PI], y: [-5, 5] }}
              />
            </motion.div>
          </div>
        </div>

        {/* Insights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="card bg-gradient-to-r from-blue-50 to-purple-50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Consistent study routine with daily practice</li>
                <li>• Strong performance in Number and Algebra topics</li>
                <li>• Good exam preparation with practice tests</li>
                <li>• Balanced study time across all topics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Focus on Higher tier topics for advanced concepts</li>
                <li>• Increase practice with Geometry and Statistics</li>
                <li>• Work on time management during exams</li>
                <li>• Review common mistakes in practice questions</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
