import React, { useState } from 'react';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { statisticsService } from '../../services';
import { toast } from 'react-hot-toast';

interface StatisticsExportProps {
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: {
    companies?: string[];
    statuses?: string[];
    locations?: string[];
  };
}

type ExportFormat = 'json' | 'csv';
type ExportType = 'overview' | 'positions' | 'interviews' | 'companies' | 'all';

interface ExportOption {
  type: ExportType;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  formats: ExportFormat[];
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    type: 'overview',
    label: 'Overview Statistics',
    description: 'Key metrics and summary statistics',
    icon: ChartBarIcon,
    formats: ['json', 'csv'],
  },
  {
    type: 'positions',
    label: 'Position Statistics',
    description: 'Detailed position and application data',
    icon: DocumentTextIcon,
    formats: ['json', 'csv'],
  },
  {
    type: 'interviews',
    label: 'Interview Statistics',
    description: 'Interview outcomes and performance data',
    icon: TableCellsIcon,
    formats: ['json', 'csv'],
  },
  {
    type: 'companies',
    label: 'Company Statistics',
    description: 'Company-wise application and success rates',
    icon: DocumentTextIcon,
    formats: ['json', 'csv'],
  },
  {
    type: 'all',
    label: 'Complete Export',
    description: 'All statistics data in a comprehensive report',
    icon: ArrowDownTrayIcon,
    formats: ['json'],
  },
];

export const StatisticsExport: React.FC<StatisticsExportProps> = ({
  dateRange,
  filters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedType, setSelectedType] = useState<ExportType>('overview');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let blob: Blob;
      let filename: string;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `statistics-${selectedType}-${timestamp}`;
      
      switch (selectedType) {
        case 'overview':
          if (dateRange?.from && dateRange?.to) {
            const data = await statisticsService.getStatsByDateRange(dateRange.from, dateRange.to);
            blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          } else {
            const data = await statisticsService.getOverview();
            blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          }
          filename = `${baseFilename}.${selectedFormat}`;
          break;
          
        case 'positions':
          const positionData = await statisticsService.getPositionStats();
          if (selectedFormat === 'csv') {
            const csv = convertToCSV(positionData);
            blob = new Blob([csv], { type: 'text/csv' });
          } else {
            blob = new Blob([JSON.stringify(positionData, null, 2)], { type: 'application/json' });
          }
          filename = `${baseFilename}.${selectedFormat}`;
          break;
          
        case 'interviews':
          const interviewData = await statisticsService.getInterviewStats();
          if (selectedFormat === 'csv') {
            const csv = convertToCSV(interviewData);
            blob = new Blob([csv], { type: 'text/csv' });
          } else {
            blob = new Blob([JSON.stringify(interviewData, null, 2)], { type: 'application/json' });
          }
          filename = `${baseFilename}.${selectedFormat}`;
          break;
          
        case 'companies':
          const companyData = await statisticsService.getCompanyStats();
          if (selectedFormat === 'csv') {
            const csv = convertToCSV(companyData);
            blob = new Blob([csv], { type: 'text/csv' });
          } else {
            blob = new Blob([JSON.stringify(companyData, null, 2)], { type: 'application/json' });
          }
          filename = `${baseFilename}.${selectedFormat}`;
          break;
          
        case 'all':
          // Get all statistics data
          const [overview, positions, interviews, companies, successRates, timeStats] = await Promise.all([
            statisticsService.getOverview(),
            statisticsService.getPositionStats(),
            statisticsService.getInterviewStats(),
            statisticsService.getCompanyStats(),
            statisticsService.getSuccessRates(),
            statisticsService.getTimeStats(),
          ]);
          
          const completeData = {
            overview,
            positions,
            interviews,
            companies,
            successRates,
            timeStats,
            exportedAt: new Date().toISOString(),
            dateRange,
            filters,
          };
          
          blob = new Blob([JSON.stringify(completeData, null, 2)], { type: 'application/json' });
          filename = `${baseFilename}.json`;
          break;
          
        default:
          throw new Error('Invalid export type');
      }
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Statistics exported successfully as ${filename}`);
      setIsOpen(false);
      
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export statistics. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any): string => {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );
      
      return [csvHeaders, ...csvRows].join('\n');
    } else {
      // Convert object to CSV format
      const entries = Object.entries(data);
      return entries.map(([key, value]) => `${key},${value}`).join('\n');
    }
  };

  const selectedOption = EXPORT_OPTIONS.find(option => option.type === selectedType);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        <span>Export</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Export Statistics"
        size="lg"
      >
        <div className="space-y-6">
          {/* Export type selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              What would you like to export?
            </h3>
            <div className="space-y-3">
              {EXPORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.type}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedType === option.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportType"
                      value={option.type}
                      checked={selectedType === option.type}
                      onChange={(e) => setSelectedType(e.target.value as ExportType)}
                      className="sr-only"
                    />
                    <Icon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Format selection */}
          {selectedOption && selectedOption.formats.length > 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Choose format
              </h3>
              <div className="flex space-x-4">
                {selectedOption.formats.map((format) => (
                  <label
                    key={format}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedFormat === format
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value={format}
                      checked={selectedFormat === format}
                      onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900 uppercase">
                      {format}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Current filters info */}
          {(dateRange || filters) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Applied Filters</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {dateRange && (
                  <div>
                    Date Range: {dateRange.from} to {dateRange.to}
                  </div>
                )}
                {filters?.companies && filters.companies.length > 0 && (
                  <div>
                    Companies: {filters.companies.join(', ')}
                  </div>
                )}
                {filters?.statuses && filters.statuses.length > 0 && (
                  <div>
                    Statuses: {filters.statuses.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Export</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};