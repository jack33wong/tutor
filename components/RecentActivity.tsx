import { Clock, BookOpen, FileText, Target, TrendingUp } from 'lucide-react';
import { UserProgress } from '@/data/userProgress';

interface RecentActivityProps {
  userProgress: UserProgress;
}

export default function RecentActivity({ userProgress }: RecentActivityProps) {
  const recentActivities = [
    ...userProgress.examAttempts.map(attempt => ({
      type: 'exam' as const,
      date: new Date(attempt.date),
      title: `Completed ${attempt.examId}`,
      description: `Scored ${attempt.score}/${attempt.totalMarks} (${attempt.percentage.toFixed(1)}%)`,
      icon: FileText,
      color: 'text-blue-600'
    })),
    ...userProgress.studySessions.map(session => ({
      type: 'study' as const,
      date: new Date(session.date),
      title: `${session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)} Session`,
      description: `${session.duration} minutes on ${session.topics.join(', ')}`,
      icon: BookOpen,
      color: 'text-green-600'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  const getActivityIcon = (type: 'exam' | 'study') => {
    return type === 'exam' ? FileText : BookOpen;
  };

  const getActivityColor = (type: 'exam' | 'study') => {
    return type === 'exam' ? 'text-blue-600' : 'text-green-600';
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity, index) => {
            const ActivityIcon = activity.icon;
            const timeAgo = getTimeAgo(activity.date);
            
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${activity.color} bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <ActivityIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No recent activity</p>
            <p className="text-xs text-gray-400">Start studying to see your progress here</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">
              {userProgress.examAttempts.length}
            </p>
            <p className="text-xs text-gray-500">Exams taken</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600">
              {Math.round(userProgress.studySessions.reduce((acc, s) => acc + s.duration, 0) / 60)}
            </p>
            <p className="text-xs text-gray-500">Hours studied</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}
