import { Clock, BookOpen, Target, Calendar } from 'lucide-react';


interface StudySessionCardProps {
  session: any;
}

const sessionTypeColors = {
  learning: 'bg-blue-100 text-blue-800',
  practice: 'bg-green-100 text-green-800',
  revision: 'bg-yellow-100 text-yellow-800',
  exam: 'bg-purple-100 text-purple-800'
};

const sessionTypeIcons = {
  learning: BookOpen,
  practice: Target,
  revision: Clock,
  exam: Target
};

export default function StudySessionCard({ session }: StudySessionCardProps) {
  const SessionIcon = sessionTypeIcons[session.sessionType as keyof typeof sessionTypeIcons];
  const date = new Date(session.date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const time = new Date(session.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Recent Study Session</h3>
          <p className="text-sm text-gray-600 mb-2">{date} at {time}</p>
          
          <div className="flex items-center space-x-4 mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${sessionTypeColors[session.sessionType as keyof typeof sessionTypeColors]}`}>
              {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {session.duration}m
            </div>
          </div>
        </div>
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <SessionIcon className="w-6 h-6 text-primary-600" />
        </div>
      </div>



      {/* Notes */}
      {session.notes && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {session.notes}
          </p>
        </div>
      )}

      {/* Session Summary */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Session Type</span>
          <span className="font-medium capitalize">{session.sessionType}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600">Duration</span>
          <span className="font-medium">{session.duration} minutes</span>
        </div>
      </div>
    </div>
  );
}
