import React, { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

interface CompanyStats {
  name: string;
  position_count: number;
  interview_count: number;
}

interface TopCompanyStats {
  company: string;
  applications: number;
  interviews: number;
  offers: number;
  success_rate: number;
}

interface CompanyStatsTableProps {
  companies: CompanyStats[];
  topCompanies: TopCompanyStats[];
  isLoading?: boolean;
  onDrillDown?: (company: string, label: string) => void;
}

type SortField = 'name' | 'position_count' | 'interview_count' | 'success_rate';
type SortDirection = 'asc' | 'desc';

export const CompanyStatsTable: React.FC<CompanyStatsTableProps> = ({
  companies,
  topCompanies,
  isLoading = false,
  onDrillDown,
}) => {
  const [sortField, setSortField] = useState<SortField>('position_count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Merge company data with top companies data
  const mergedData = useMemo(() => {
    const companyMap = new Map<string, CompanyStats>();
    companies.forEach(company => {
      companyMap.set(company.name, company);
    });

    const topCompanyMap = new Map<string, TopCompanyStats>();
    topCompanies.forEach(company => {
      topCompanyMap.set(company.company, company);
    });

    // Get all unique company names
    const allCompanyNames = new Set([
      ...companies.map(c => c.name),
      ...topCompanies.map(c => c.company),
    ]);

    return Array.from(allCompanyNames).map(name => {
      const basicStats = companyMap.get(name);
      const topStats = topCompanyMap.get(name);

      return {
        name,
        position_count: basicStats?.position_count || topStats?.applications || 0,
        interview_count: basicStats?.interview_count || topStats?.interviews || 0,
        offers: topStats?.offers || 0,
        success_rate: topStats?.success_rate || 0,
      };
    });
  }, [companies, topCompanies]);

  const sortedData = useMemo(() => {
    return [...mergedData].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'position_count':
          aValue = a.position_count;
          bValue = b.position_count;
          break;
        case 'interview_count':
          aValue = a.interview_count;
          bValue = b.interview_count;
          break;
        case 'success_rate':
          aValue = a.success_rate;
          bValue = b.success_rate;
          break;
        default:
          aValue = a.position_count;
          bValue = b.position_count;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [mergedData, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({
    field,
    children,
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-gray-700"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 mb-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <div className="text-lg font-medium mb-2">No Company Data</div>
        <p className="text-sm">Apply to positions to see company statistics</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="name">Company</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="position_count">Applications</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="interview_count">Interviews</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="success_rate">Success Rate</SortButton>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((company) => (
            <tr 
              key={company.name} 
              className={`hover:bg-gray-50 ${onDrillDown ? 'cursor-pointer' : ''}`}
              onClick={() => onDrillDown && onDrillDown(company.name, company.name)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {company.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <BriefcaseIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{company.position_count}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{company.interview_count}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {company.success_rate > 0 ? (
                    <>
                      <TrophyIcon className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {(company.success_rate * 100).toFixed(1)}%
                      </span>
                      {company.offers > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({company.offers} offers)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Summary footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total Companies: {sortedData.length}</span>
          <span>
            Total Applications: {sortedData.reduce((sum, c) => sum + c.position_count, 0)}
          </span>
          <span>
            Total Interviews: {sortedData.reduce((sum, c) => sum + c.interview_count, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};