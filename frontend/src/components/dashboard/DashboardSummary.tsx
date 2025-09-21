import React from 'react';
import {
  BriefcaseIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { Position, PositionStatus } from '../../types';
import { cn } from '../../utils';

interface DashboardSummaryProps {
  positions: Position[];
  loading?: boolean;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray';
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <ArrowTrendingUpIcon
                className={cn(
                  'h-4 w-4 mr-1',
                  trend.isPositive ? 'text-green-500' : 'text-red-500',
                  !trend.isPositive && 'transform rotate-180'
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const StatusBreakdown: React.FC<{ positions: Position[] }> = ({ positions }) => {
  const statusCounts = positions.reduce((acc, position) => {
    acc[position.status] = (acc[position.status] || 0) + 1;
    return acc;
  }, {} as Record<PositionStatus, number>);

  const statusConfig = {
    applied: { label: 'Applied', color: 'bg-blue-500' },
    screening: { label: 'Screening', color: 'bg-yellow-500' },
    interviewing: { label: 'Interviewing', color: 'bg-purple-500' },
    offer: { label: 'Offer', color: 'bg-green-500' },
    rejected: { label: 'Rejected', color: 'bg-red-500' },
    withdrawn: { label: 'Withdrawn', color: 'bg-gray-500' },
  };

  const total = positions.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Application Status Breakdown
      </h3>
      <div className="space-y-3">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = statusCounts[status as PositionStatus] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn('w-3 h-3 rounded-full', config.color)} />
                <span className="text-sm font-medium text-gray-700">
                  {config.label}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {percentage.toFixed(0)}%
                </span>
                <span className="text-sm font-semibold text-gray-900 min-w-[2rem] text-right">
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecentActivity: React.FC<{ positions: Position[] }> = ({ positions }) => {
  const recentPositions = positions
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const getActivityText = (position: Position) => {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(position.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceUpdate === 0) {
      return 'Updated today';
    }
    if (daysSinceUpdate === 1) {
      return 'Updated yesterday';
    }
    return `Updated ${daysSinceUpdate} days ago`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      {recentPositions.length > 0 ? (
        <div className="space-y-3">
          {recentPositions.map((position) => (
            <div key={position.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
              <div className="flex-shrink-0">
                <BriefcaseIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {position.title}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {position.company}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-500">
                  {getActivityText(position)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No recent activity</p>
      )}
    </div>
  );
};

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  positions,
  loading = false,
  className,
}) => {
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalPositions = positions.length;
  const totalInterviews = positions.reduce((sum, pos) => sum + (pos.interviews?.length || 0), 0);
  const activeApplications = positions.filter(pos => 
    ['applied', 'screening', 'interviewing'].includes(pos.status)
  ).length;
  const offers = positions.filter(pos => pos.status === 'offer').length;
  
  const upcomingInterviews = positions
    .flatMap(pos => pos.interviews || [])
    .filter(interview => 
      interview.outcome === 'pending' && 
      new Date(interview.scheduled_date) > new Date()
    ).length;

  const passedInterviews = positions
    .flatMap(pos => pos.interviews || [])
    .filter(interview => interview.outcome === 'passed').length;

  const interviewSuccessRate = totalInterviews > 0 
    ? Math.round((passedInterviews / totalInterviews) * 100) 
    : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Applications"
          value={totalPositions}
          subtitle={`${activeApplications} active`}
          icon={BriefcaseIcon}
          color="blue"
        />
        <StatCard
          title="Total Interviews"
          value={totalInterviews}
          subtitle={`${upcomingInterviews} upcoming`}
          icon={UserGroupIcon}
          color="purple"
        />
        <StatCard
          title="Success Rate"
          value={`${interviewSuccessRate}%`}
          subtitle={`${passedInterviews} passed interviews`}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Offers Received"
          value={offers}
          subtitle={offers > 0 ? 'Congratulations!' : 'Keep going!'}
          icon={ArrowTrendingUpIcon}
          color={offers > 0 ? 'green' : 'gray'}
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusBreakdown positions={positions} />
        <RecentActivity positions={positions} />
      </div>
    </div>
  );
};

export default DashboardSummary;