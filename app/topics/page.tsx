'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Target, CheckCircle, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { gcseMathsSyllabus } from '@/data/syllabus';
import { sampleUserProgress } from '@/data/userProgress';
import TopicCard from '@/components/TopicCard';

export default function TopicsPage() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'foundation' | 'higher'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const userProgress = sampleUserProgress;

  // Filter topics based on difficulty and search
  const filteredTopics = gcseMathsSyllabus.filter(topic => {
    const matchesDifficulty = selectedDifficulty === 'all' || topic.difficulty === selectedDifficulty;
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDifficulty && matchesSearch;
  });

  const foundationTopics = gcseMathsSyllabus.filter(t => t.difficulty === 'foundation');
  const higherTopics = gcseMathsSyllabus.filter(t => t.difficulty === 'higher');

  const getTopicProgress = (topicId: string) => {
    return userProgress.topics.find(t => t.topicId === topicId);
  };

  const getOverallProgress = () => {
    const completedTopics = userProgress.topics.filter(t => t.completed).length;
    const totalTopics = userProgress.topics.length;
    return Math.round((completedTopics / totalTopics) * 100);
  };

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
                <h1 className="text-3xl font-bold text-gray-900">All Topics</h1>
                <p className="text-gray-600">Master GCSE Maths with structured learning paths</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Overall Progress</p>
              <p className="text-2xl font-bold text-primary-600">{getOverallProgress()}%</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Difficulty Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedDifficulty('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDifficulty === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Topics ({gcseMathsSyllabus.length})
              </button>
              <button
                onClick={() => setSelectedDifficulty('foundation')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDifficulty === 'foundation'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Foundation ({foundationTopics.length})
              </button>
              <button
                onClick={() => setSelectedDifficulty('higher')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDifficulty === 'higher'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Higher ({higherTopics.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <BookOpen className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Foundation Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((foundationTopics.filter(t => getTopicProgress(t.id)?.completed).length / foundationTopics.length) * 100)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Higher Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((higherTopics.filter(t => getTopicProgress(t.id)?.completed).length / higherTopics.length) * 100)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Study Time</p>
                <p className="text-2xl font-bold text-success-600">
                  {Math.round(userProgress.topics.reduce((acc, t) => acc + t.timeSpent, 0) / 60)}h
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="space-y-6">
          {filteredTopics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map((topic, index) => {
                const progress = getTopicProgress(topic.id);
                
                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TopicCard
                      topic={topic}
                      progress={progress || {
                        topicId: topic.id,
                        subtopicProgress: [],
                        completed: false,
                        completionPercentage: 0,
                        lastStudied: new Date(),
                        timeSpent: 0
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No topics found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
