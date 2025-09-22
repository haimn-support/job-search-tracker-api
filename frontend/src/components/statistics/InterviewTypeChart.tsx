import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { InterviewType } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface InterviewTypeChartProps {
  data?: Record<InterviewType, number> | undefined;
  isLoading?: boolean;
  onDrillDown?: (type: string, label: string) => void;
}

const TYPE_COLORS = {
  [InterviewType.TECHNICAL]: '#3B82F6', // Blue
  [InterviewType.BEHAVIORAL]: '#10B981', // Green
  [InterviewType.HR]: '#F59E0B', // Amber
  [InterviewType.FINAL]: '#8B5CF6', // Purple
};

const TYPE_LABELS = {
  [InterviewType.TECHNICAL]: 'Technical',
  [InterviewType.BEHAVIORAL]: 'Behavioral',
  [InterviewType.HR]: 'HR/Screening',
  [InterviewType.FINAL]: 'Final',
};

export const InterviewTypeChart: React.FC<InterviewTypeChartProps> = ({
  data,
  isLoading = false,
  onDrillDown,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Interview Data</div>
          <p className="text-sm">Schedule interviews to see type distribution</p>
        </div>
      </div>
    );
  }

  // Filter out types with 0 count and prepare chart data
  const filteredData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => (b as number) - (a as number)); // Sort by count descending

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Interview Data</div>
          <p className="text-sm">Schedule interviews to see type distribution</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: filteredData.map(([type]) => TYPE_LABELS[type as InterviewType]),
    datasets: [
      {
        data: filteredData.map(([_, count]) => count),
        backgroundColor: filteredData.map(([type]) => TYPE_COLORS[type as InterviewType]),
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    onClick: (event, elements) => {
      if (onDrillDown && elements.length > 0) {
        const elementIndex = elements[0].index;
        const typeKey = filteredData[elementIndex][0];
        const label = TYPE_LABELS[typeKey as InterviewType];
        onDrillDown(typeKey, label);
      }
    },
  };

  const totalInterviews = filteredData.reduce((sum, [_, count]) => sum + (count as number), 0);
  const mostCommonType = filteredData[0];

  return (
    <div className="relative">
      <div className="h-64">
        <Pie data={chartData} options={options} />
      </div>
      
      {/* Summary stats below chart */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className="font-medium text-gray-900">{totalInterviews}</div>
          <div className="text-gray-600">Total Interviews</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {mostCommonType ? TYPE_LABELS[mostCommonType[0] as InterviewType] : 'N/A'}
          </div>
          <div className="text-gray-600">Most Common</div>
        </div>
      </div>
    </div>
  );
};