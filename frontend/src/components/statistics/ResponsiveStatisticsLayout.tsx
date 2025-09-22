import React, { useState } from 'react';
import { 
  ChartBarIcon,
  TableCellsIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface ResponsiveStatisticsLayoutProps {
  children: React.ReactNode;
  onFilterChange?: (filters: any) => void;
  onExport?: () => void;
  isLoading?: boolean;
}

type ViewMode = 'overview' | 'charts' | 'tables' | 'companies';

const VIEW_MODES = [
  {
    key: 'overview' as const,
    label: 'Overview',
    icon: ChartBarIcon,
    description: 'Key metrics and summary',
  },
  {
    key: 'charts' as const,
    label: 'Charts',
    icon: ChartBarIcon,
    description: 'Visual analytics',
  },
  {
    key: 'tables' as const,
    label: 'Tables',
    icon: TableCellsIcon,
    description: 'Detailed data tables',
  },
  {
    key: 'companies' as const,
    label: 'Companies',
    icon: BuildingOfficeIcon,
    description: 'Company statistics',
  },
];

export const ResponsiveStatisticsLayout: React.FC<ResponsiveStatisticsLayoutProps> = ({
  children,
  onFilterChange,
  onExport,
  isLoading = false,
}) => {
  const [activeView, setActiveView] = useState<ViewMode>('overview');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Statistics</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Cog6ToothIcon className="h-4 w-4" />
            </Button>
            {onExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onExport}
                disabled={isLoading}
              >
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Mobile view selector */}
        <div className="mt-3 flex space-x-1 bg-gray-100 rounded-lg p-1">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.key}
                onClick={() => setActiveView(mode.key)}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === mode.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Mobile filters panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Filters</h3>
            {/* Filter controls would go here */}
            <div className="text-sm text-gray-600">
              Filter controls will be implemented based on requirements
            </div>
          </div>
        )}
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statistics & Analytics</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive overview of your job search progress and performance
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {onExport && (
                <Button
                  variant="secondary"
                  onClick={onExport}
                  disabled={isLoading}
                >
                  Export Data
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Desktop layout */}
        <div className="hidden lg:block">
          {children}
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden">
          {renderMobileContent(activeView, children)}
        </div>
      </div>
    </div>
  );
};

const renderMobileContent = (activeView: ViewMode, children: React.ReactNode) => {
  // In a real implementation, you would pass different sections of the children
  // based on the active view. For now, we'll show all content.
  
  switch (activeView) {
    case 'overview':
      return (
        <div className="space-y-6">
          {/* Key metrics cards - these would be extracted from children */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Placeholder metrics */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-gray-600">Applications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-gray-600">Interviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">33%</div>
                <div className="text-sm text-gray-600">Interview Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">2</div>
                <div className="text-sm text-gray-600">Offers</div>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'charts':
      return (
        <div className="space-y-6">
          {/* Charts would be rendered here */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Position Status</h2>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart component would be rendered here
            </div>
          </div>
        </div>
      );
      
    case 'tables':
      return (
        <div className="space-y-6">
          {/* Tables would be rendered here */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Company Statistics</h2>
            </div>
            <div className="p-4 text-gray-500 text-center">
              Table component would be rendered here
            </div>
          </div>
        </div>
      );
      
    case 'companies':
      return (
        <div className="space-y-6">
          {/* Company-specific content */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Companies</h2>
            <div className="space-y-3">
              {/* Placeholder company items */}
              {['Company A', 'Company B', 'Company C'].map((company, index) => (
                <div key={company} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{company}</div>
                    <div className="text-sm text-gray-600">{3 - index} applications</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round((3 - index) * 16.7)}% success
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      
    default:
      return children;
  }
};