import { LucideIcon } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'error';
  subtitle?: string;
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'text-primary-600',
    value: 'text-primary-600'
  },
  success: {
    bg: 'bg-success-50',
    icon: 'text-success-600',
    value: 'text-success-600'
  },
  warning: {
    bg: 'bg-warning-50',
    icon: 'text-warning-600',
    value: 'text-warning-600'
  },
  error: {
    bg: 'bg-error-50',
    icon: 'text-error-600',
    value: 'text-error-600'
  }
};

export default function ProgressCard({ title, value, icon: Icon, color, subtitle }: ProgressCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
