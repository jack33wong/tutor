import { BookOpen, Clock, CheckCircle } from 'lucide-react';
import { Topic } from '@/data/syllabus';
import { TopicProgress } from '@/data/userProgress';

interface TopicCardProps {
  topic: Topic;
  progress: TopicProgress;
}

const difficultyColors = {
  foundation: 'bg-blue-100 text-blue-800',
  higher: 'bg-purple-100 text-purple-800'
};

const masteryColors = {
  'not-started': 'bg-gray-100 text-gray-800',
  'beginner': 'bg-yellow-100 text-yellow-800',
  'intermediate': 'bg-orange-100 text-orange-800',
  'mastered': 'bg-green-100 text-green-800'
};

export default function TopicCard({ topic, progress }: TopicCardProps) {
  const completedSubtopics = progress.subtopicProgress.filter(s => s.completed).length;
  const totalSubtopics = progress.subtopicProgress.length;
  const averageMastery = progress.subtopicProgress.reduce((acc, s) => {
    const masteryLevels = { 'not-started': 0, 'beginner': 1, 'intermediate': 2, 'mastered': 3 };
    return acc + masteryLevels[s.masteryLevel];
  }, 0) / totalSubtopics;

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{topic.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{topic.description}</p>
          
          <div className="flex items-center space-x-4 mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyColors[topic.difficulty]}`}>
              {topic.difficulty}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {topic.estimatedHours}h
            </div>
          </div>
        </div>
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-primary-600" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{progress.completionPercentage}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Subtopic Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Subtopics</span>
          <span className="font-medium">{completedSubtopics}/{totalSubtopics}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {progress.subtopicProgress.slice(0, 4).map((subtopic) => (
            <div key={subtopic.subtopicId} className="flex items-center space-x-2">
              {subtopic.completed ? (
                <CheckCircle className="w-4 h-4 text-success-500" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${masteryColors[subtopic.masteryLevel]}`}>
                {subtopic.masteryLevel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Spent */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Time spent</span>
          <span className="font-medium">{Math.round(progress.timeSpent / 60)}h {progress.timeSpent % 60}m</span>
        </div>
      </div>
    </div>
  );
}
