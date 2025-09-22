import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PositionStatus } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PositionStatusChartProps {
  data?: Record<PositionStatus, number> | undefined;
  isLoading?: boolean;
  onDrillDown?: (status: string, label: string) => void;
}

const STATUS_COLORS = {
  [PositionStatus.APPLIED]: '#3B82F6', // Blue
  [PositionStatus.SCREENING]: '#F59E0B', // Amber
  [PositionStatus.INTERVIEWING]: '#8B5CF6', // Purple
  [PositionStatus.OFFER]: '#10B981', // Green
  [PositionStatus.REJECTED]: '#EF4444', // Red
  [PositionStatus.WITHDRAWN]: '#6B7280', // Gray
};

const STATUS_LABELS = {
  [PositionStatus.APPLIED]: 'Applied',
  [PositionStatus.SCREENING]: 'Screening',
  [PositionStatus.INTERVIEWING]: 'Interviewing',
  [PositionStatus.OFFER]: 'Offer',
  [PositionStatus.REJECTED]: 'Rejected',
  [PositionStatus.WITHDRAWN]: 'Withdrawn',
};

export const PositionStatusChart: React.FC<PositionStatusChartProps> = ({
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
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <p className="text-sm">Start applying to positions to see statistics</p>
        </div>
      </div>
    );
  }

  // Filter out statuses with 0 count and prepare chart data
  const filteredData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => (b as number) - (a as number)); // Sort by count descending

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <p className="text-sm">Start applying to positions to see statistics</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: filteredData.map(([status]) => STATUS_LABELS[status as PositionStatus]),
    datasets: [
      {
        data: filteredData.map(([_, count]) => count),
        backgroundColor: filteredData.map(([status]) => STATUS_COLORS[status as PositionStatus]),
        borderColor: filteredData.map(([status]) => STATUS_COLORS[status as PositionStatus]),
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
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
        onClick: (event, legendItem) => {
          if (onDrillDown && legendItem.text) {
            const statusKey = Object.keys(STATUS_LABELS).find(
              key => STATUS_LABELS[key as PositionStatus] === legendItem.text
            );
            if (statusKey) {
              onDrillDown(statusKey, legendItem.text);
            }
          }
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
    cutout: '60%',
    onClick: (event, elements) => {
      if (onDrillDown && elements.length > 0) {
        const elementIndex = elements[0].index;
        const statusKey = filteredData[elementIndex][0];
        const label = STATUS_LABELS[statusKey as PositionStatus];
        onDrillDown(statusKey, label);
      }
    },
  };

  const totalPositions = filteredData.reduce((sum, [_, count]) => sum + (count as number), 0);

  return (
    <div className="relative">
      <div className="h-64 relative">
        <Doughnut data={chartData} options={options} />
        {/* Center text showing total */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalPositions}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>
      
      {/* Summary stats below chart */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {data[PositionStatus.OFFER] || 0}
          </div>
          <div className="text-gray-600">Offers</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {data[PositionStatus.INTERVIEWING] || 0}
          </div>
          <div className="text-gray-600">Active</div>
        </div>
      </div>
    </div>
  );
};