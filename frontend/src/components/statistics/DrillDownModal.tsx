import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  XMarkIcon,
  ChevronLeftIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { statisticsService } from '../../services';
import { PositionStatus, InterviewOutcome, InterviewType } from '../../types';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'position-status' | 'interview-outcome' | 'interview-type' | 'company';
  value: string;
  label: string;
}

interface DrillDownData {
  positions?: Array<{
    id: string;
    title: string;
    company: string;
    status: PositionStatus;
    application_date: string;
    interview_count: number;
  }>;
  interviews?: Array<{
    id: string;
    position_title: string;
    company: string;
    type: InterviewType;
    scheduled_date: string;
    outcome: InterviewOutcome;
  }>;
  companyDetails?: {
    name: string;
    total_positions: number;
    total_interviews: number;
    success_rate: number;
    positions: Array<{
      id: string;
      title: string;
      status: PositionStatus;
      application_date: string;
    }>;
  };
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  type,
  value,
  label,
}) => {
  const [data, setData] = useState<DrillDownData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && value) {
      fetchDrillDownData();
    }
  }, [isOpen, type, value]);

  const fetchDrillDownData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result: DrillDownData = {};
      
      switch (type) {
        case 'position-status':
          // Fetch positions with specific status
          // This would need to be implemented in the API
          result.positions = []; // Placeholder
          break;
          
        case 'interview-outcome':
          // Fetch interviews with specific outcome
          result.interviews = []; // Placeholder
          break;
          
        case 'interview-type':
          // Fetch interviews of specific type
          result.interviews = []; // Placeholder
          break;
          
        case 'company':
          // Fetch company details
          const companyStats = await statisticsService.getCompanyStats();
          const company = companyStats.find(c => c.name === value);
          if (company) {
            result.companyDetails = {
              name: company.name,
              total_positions: company.position_count,
              total_interviews: company.interview_count,
              success_rate: 0, // Would need to be calculated
              positions: [], // Would need to be fetched
            };
          }
          break;
      }
      
      setData(result);
    } catch (err) {
      setError('Failed to load detailed data');
      console.error('Drill down error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">{error}</div>
          <Button onClick={fetchDrillDownData} variant="secondary" size="sm">
            Try Again
          </Button>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="text-center py-12 text-gray-500">
          No data available
        </div>
      );
    }

    switch (type) {
      case 'position-status':
        return renderPositionsList(data.positions || []);
      case 'interview-outcome':
      case 'interview-type':
        return renderInterviewsList(data.interviews || []);
      case 'company':
        return renderCompanyDetails(data.companyDetails);
      default:
        return null;
    }
  };

  const renderPositionsList = (positions: DrillDownData['positions']) => {
    if (!positions || positions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No positions found with status "{label}"
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {positions.length} position{positions.length !== 1 ? 's' : ''} with status "{label}"
        </div>
        <div className="space-y-3">
          {positions.map((position) => (
            <div
              key={position.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{position.title}</h4>
                  <p className="text-sm text-gray-600">{position.company}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Applied: {new Date(position.application_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {position.interview_count} interview{position.interview_count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInterviewsList = (interviews: DrillDownData['interviews']) => {
    if (!interviews || interviews.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No interviews found for "{label}"
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {interviews.length} interview{interviews.length !== 1 ? 's' : ''} for "{label}"
        </div>
        <div className="space-y-3">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{interview.position_title}</h4>
                  <p className="text-sm text-gray-600">{interview.company}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(interview.scheduled_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm capitalize text-gray-600">
                    {interview.type}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                    interview.outcome === 'passed' ? 'bg-green-100 text-green-800' :
                    interview.outcome === 'failed' ? 'bg-red-100 text-red-800' :
                    interview.outcome === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {interview.outcome}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCompanyDetails = (company: DrillDownData['companyDetails']) => {
    if (!company) {
      return (
        <div className="text-center py-8 text-gray-500">
          Company details not available
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Company overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{company.total_positions}</div>
              <div className="text-sm text-gray-600">Applications</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{company.total_interviews}</div>
              <div className="text-sm text-gray-600">Interviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {(company.success_rate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Positions list */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Positions Applied</h4>
          {company.positions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No positions found
            </div>
          ) : (
            <div className="space-y-2">
              {company.positions.map((position) => (
                <div
                  key={position.id}
                  className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{position.title}</div>
                    <div className="text-sm text-gray-600">
                      Applied: {new Date(position.application_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    position.status === 'offer' ? 'bg-green-100 text-green-800' :
                    position.status === 'interviewing' ? 'bg-blue-100 text-blue-800' :
                    position.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {position.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${label} Details`}
      size="lg"
    >
      <div className="max-h-96 overflow-y-auto">
        {renderContent()}
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      </div>
    </Modal>
  );
};