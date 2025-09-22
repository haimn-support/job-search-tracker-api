import React from 'react';
import {
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { PositionStatistics } from '../../types';

interface KeyMetricsCardsProps {
  overview?: PositionStatistics | undefined;
  successRates?: {
    application_to_interview_rate: number;
    interview_to_offer_rate: number;
    overall_success_rate: number;
    average_interviews_per_position: number;
  } | undefined;
  isLoading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  isLoading = false,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const KeyMetricsCards: React.FC<KeyMetricsCardsProps> = ({
  overview,
  successRates,
  isLoading,
}) => {
  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;
  const formatDecimal = (value: number) => value.toFixed(1);

  const metrics = [
    {
      title: 'Total Applications',
      value: overview?.total_positions || 0,
      subtitle: 'Positions applied to',
      icon: BriefcaseIcon,
      color: 'blue' as const,
    },
    {
      title: 'Total Interviews',
      value: overview?.total_interviews || 0,
      subtitle: 'Interviews conducted',
      icon: ChatBubbleLeftRightIcon,
      color: 'green' as const,
    },
    {
      title: 'Interview Rate',
      value: successRates ? formatPercentage(successRates.application_to_interview_rate) : '0%',
      subtitle: 'Applications to interviews',
      icon: ChartBarIcon,
      color: 'purple' as const,
    },
    {
      title: 'Offer Rate',
      value: successRates ? formatPercentage(successRates.interview_to_offer_rate) : '0%',
      subtitle: 'Interviews to offers',
      icon: TrophyIcon,
      color: 'orange' as const,
    },
    {
      title: 'Overall Success',
      value: successRates ? formatPercentage(successRates.overall_success_rate) : '0%',
      subtitle: 'Applications to offers',
      icon: CheckCircleIcon,
      color: 'green' as const,
    },
    {
      title: 'Avg Interviews',
      value: successRates ? formatDecimal(successRates.average_interviews_per_position) : '0.0',
      subtitle: 'Per position',
      icon: ClockIcon,
      color: 'indigo' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          icon={metric.icon}
          color={metric.color}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};