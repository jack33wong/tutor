import { FileText, Clock, Target, TrendingUp } from 'lucide-react';
import { ExamPaper } from '@/data/examPapers';
import { ExamAttempt } from '@/data/userProgress';

interface ExamCardProps {
  exam: ExamPaper;
  attempt: ExamAttempt;
}

const gradeColors = {
  '9': 'bg-purple-100 text-purple-800',
  '8': 'bg-purple-100 text-purple-800',
  '7': 'bg-blue-100 text-blue-800',
  '6': 'bg-green-100 text-green-800',
  '5': 'bg-yellow-100 text-yellow-800',
  '4': 'bg-orange-100 text-orange-800',
  '3': 'bg-red-100 text-red-800',
  '2': 'bg-red-100 text-red-800',
  '1': 'bg-red-100 text-red-800'
};

export default function ExamCard({ exam, attempt }: ExamCardProps) {
  const percentage = attempt.percentage;
  const grade = attempt.grade || 'N/A';
  const date = new Date(attempt.date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-error-600';
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 80) return TrendingUp;
    return Target;
  };

  const PerformanceIcon = getPerformanceIcon(percentage);

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{exam.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{date}</p>
          
          <div className="flex items-center space-x-4 mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${gradeColors[grade as keyof typeof gradeColors] || 'bg-gray-100 text-gray-800'}`}>
              Grade {grade}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {attempt.timeSpent}/{exam.timeLimit}m
            </div>
          </div>
        </div>
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary-600" />
        </div>
      </div>

      {/* Score Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Score</span>
          <span className={`text-lg font-bold ${getPerformanceColor(percentage)}`}>
            {attempt.score}/{attempt.totalMarks}
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-500">Percentage</span>
          <span className={`font-medium ${getPerformanceColor(percentage)}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Questions</span>
          <span className="font-medium">
            {attempt.questionResults.filter(q => q.correct).length}/{attempt.questionResults.length} correct
          </span>
        </div>
        
        <div className="grid grid-cols-5 gap-1">
          {attempt.questionResults.slice(0, 10).map((question, index) => (
            <div 
              key={index}
              className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium ${
                question.correct 
                  ? 'bg-success-100 text-success-800' 
                  : 'bg-error-100 text-error-800'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PerformanceIcon className={`w-4 h-4 ${getPerformanceColor(percentage)}`} />
            <span className="text-sm text-gray-600">Performance</span>
          </div>
          <span className={`text-sm font-medium ${getPerformanceColor(percentage)}`}>
            {percentage >= 80 ? 'Excellent' : percentage >= 70 ? 'Good' : percentage >= 60 ? 'Average' : 'Needs Improvement'}
          </span>
        </div>
      </div>
    </div>
  );
}
