import { Clock, BookOpen, FileText, Target, TrendingUp } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

interface RecentActivityProps {
}

export default function RecentActivity({ }: RecentActivityProps) {
  const { userProgress } = useProgress('default-user');
  const recentActivities = userProgress.completedQuestions
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5)
    .map(question => ({
      type: 'question' as const,
      date: new Date(question.completedAt),
      title: `Completed Question`,
      description: `${question.marks} marks • ${question.topic}`,
      icon: FileText,
      color: 'text-blue-600'
    }));

  const getActivityIcon = (type: 'question') => {
    return FileText;
  };

  const getActivityColor = (type: 'question') => {
    return 'text-blue-600';
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
              {userProgress.completedQuestions.length}
            </p>
            <p className="text-xs text-gray-500">Questions completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600">
              {userProgress.stats.completionRate}%
            </p>
            <p className="text-xs text-gray-500">Completion rate</p>
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
