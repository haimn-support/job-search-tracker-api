import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { InterviewOutcome } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface InterviewOutcomeChartProps {
  data?: Record<InterviewOutcome, number> | undefined;
  isLoading?: boolean;
  onDrillDown?: (outcome: string, label: string) => void;
}

const OUTCOME_COLORS = {
  [InterviewOutcome.PENDING]: '#F59E0B', // Amber
  [InterviewOutcome.PASSED]: '#10B981', // Green
  [InterviewOutcome.FAILED]: '#EF4444', // Red
  [InterviewOutcome.CANCELLED]: '#6B7280', // Gray
};

const OUTCOME_LABELS = {
  [InterviewOutcome.PENDING]: 'Pending',
  [InterviewOutcome.PASSED]: 'Passed',
  [InterviewOutcome.FAILED]: 'Failed',
  [InterviewOutcome.CANCELLED]: 'Cancelled',
};

export const InterviewOutcomeChart: React.FC<InterviewOutcomeChartProps> = ({
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
          <p className="text-sm">Schedule interviews to see outcome statistics</p>
        </div>
      </div>
    );
  }

  // Prepare chart data in a specific order
  const orderedOutcomes = [
    InterviewOutcome.PENDING,
    InterviewOutcome.PASSED,
    InterviewOutcome.FAILED,
    InterviewOutcome.CANCELLED,
  ];

  const chartData = {
    labels: orderedOutcomes.map(outcome => OUTCOME_LABELS[outcome]),
    datasets: [
      {
        label: 'Interviews',
        data: orderedOutcomes.map(outcome => data[outcome] || 0),
        backgroundColor: orderedOutcomes.map(outcome => OUTCOME_COLORS[outcome]),
        borderColor: orderedOutcomes.map(outcome => OUTCOME_COLORS[outcome]),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const total = Object.values(data).reduce((a, b) => (a as number) + (b as number), 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: '#F3F4F6',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    onClick: (event, elements) => {
      if (onDrillDown && elements.length > 0) {
        const elementIndex = elements[0].index;
        const outcome = orderedOutcomes[elementIndex];
        const label = OUTCOME_LABELS[outcome];
        onDrillDown(outcome, label);
      }
    },
  };

  const totalInterviews = Object.values(data).reduce((sum, count) => (sum as number) + (count as number), 0);
  const passedInterviews = data[InterviewOutcome.PASSED] || 0;
  const passRate = totalInterviews > 0 ? ((passedInterviews / totalInterviews) * 100).toFixed(1) : '0';

  return (
    <div className="relative">
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Summary stats below chart */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="font-medium text-gray-900">{totalInterviews}</div>
          <div className="text-gray-600">Total</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-green-600">{passedInterviews}</div>
          <div className="text-gray-600">Passed</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900">{passRate}%</div>
          <div className="text-gray-600">Pass Rate</div>
        </div>
      </div>
    </div>
  );
};