import { PositionFilters, PositionStatus } from '../types';

export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface FilterCombinationRule {
  name: string;
  condition: (filters: PositionFilters) => boolean;
  message: string;
  type: 'error' | 'warning' | 'suggestion';
}

// Define filter combination rules
const FILTER_RULES: FilterCombinationRule[] = [
  // Date validation rules
  {
    name: 'date_range_order',
    condition: (filters) => {
      if (!filters.date_from || !filters.date_to) return true;
      return new Date(filters.date_from) <= new Date(filters.date_to);
    },
    message: 'Start date must be before or equal to end date',
    type: 'error',
  },
  {
    name: 'future_date_warning',
    condition: (filters) => {
      const today = new Date().toISOString().split('T')[0];
      if (filters.date_from && filters.date_from > today) return false;
      if (filters.date_to && filters.date_to > today) return false;
      return true;
    },
    message: 'You have selected future dates. Most applications are in the past.',
    type: 'warning',
  },
  {
    name: 'very_old_dates',
    condition: (filters) => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
      
      if (filters.date_to && filters.date_to < oneYearAgoStr) return false;
      return true;
    },
    message: 'You are filtering for very old applications. Consider expanding your date range.',
    type: 'warning',
  },
  
  // Status and search combination rules
  {
    name: 'rejected_with_company_search',
    condition: (filters) => {
      if (filters.status === PositionStatus.REJECTED && filters.company) return false;
      return true;
    },
    message: 'Consider removing company filter when looking at rejected applications to see patterns across companies.',
    type: 'suggestion',
  },
  {
    name: 'offer_status_suggestion',
    condition: (filters) => {
      if (filters.status === PositionStatus.OFFER) return false;
      return true;
    },
    message: 'Great! You have offers. Consider also filtering by "Interviewing" status to track your pipeline.',
    type: 'suggestion',
  },
  
  // Search optimization rules
  {
    name: 'empty_search_with_filters',
    condition: (filters) => {
      const hasOtherFilters = filters.status || filters.company || filters.date_from || filters.date_to;
      const hasEmptySearch = !filters.search || filters.search.trim() === '';
      
      if (hasOtherFilters && hasEmptySearch) return false;
      return true;
    },
    message: 'Try adding a search term to narrow down your results further.',
    type: 'suggestion',
  },
  {
    name: 'too_specific_search',
    condition: (filters) => {
      if (!filters.search) return true;
      const searchTerms = filters.search.trim().split(/\s+/);
      return searchTerms.length <= 4; // More than 4 terms might be too specific
    },
    message: 'Your search might be too specific. Try using fewer keywords.',
    type: 'warning',
  },
  
  // Date range optimization
  {
    name: 'very_narrow_date_range',
    condition: (filters) => {
      if (!filters.date_from || !filters.date_to) return true;
      
      const startDate = new Date(filters.date_from);
      const endDate = new Date(filters.date_to);
      const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      return diffDays >= 7; // Less than a week might be too narrow
    },
    message: 'Your date range is very narrow (less than a week). Consider expanding it to see more results.',
    type: 'suggestion',
  },
  {
    name: 'very_wide_date_range',
    condition: (filters) => {
      if (!filters.date_from || !filters.date_to) return true;
      
      const startDate = new Date(filters.date_from);
      const endDate = new Date(filters.date_to);
      const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      return diffDays <= 365; // More than a year might be too wide
    },
    message: 'Your date range spans more than a year. Consider narrowing it down for more relevant results.',
    type: 'suggestion',
  },
];

/**
 * Validates filter combinations and provides feedback
 */
export const validateFilters = (filters: PositionFilters): FilterValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Apply all rules
  FILTER_RULES.forEach(rule => {
    if (!rule.condition(filters)) {
      switch (rule.type) {
        case 'error':
          errors.push(rule.message);
          break;
        case 'warning':
          warnings.push(rule.message);
          break;
        case 'suggestion':
          suggestions.push(rule.message);
          break;
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
};

/**
 * Suggests filter improvements based on current filters
 */
export const suggestFilterImprovements = (
  filters: PositionFilters,
  resultCount: number
): string[] => {
  const suggestions: string[] = [];

  // No results suggestions
  if (resultCount === 0) {
    if (Object.keys(filters).length > 0) {
      suggestions.push('No results found. Try removing some filters or broadening your search criteria.');
    }
    
    if (filters.search && filters.search.length > 20) {
      suggestions.push('Try using shorter, more general search terms.');
    }
    
    if (filters.company && filters.status) {
      suggestions.push('Try removing either the company or status filter to see more results.');
    }
    
    if (filters.date_from && filters.date_to) {
      const daysDiff = (new Date(filters.date_to).getTime() - new Date(filters.date_from).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 30) {
        suggestions.push('Try expanding your date range to see more applications.');
      }
    }
  }

  // Too many results suggestions
  if (resultCount > 50) {
    if (!filters.status) {
      suggestions.push('Consider filtering by status to narrow down your results.');
    }
    
    if (!filters.date_from && !filters.date_to) {
      suggestions.push('Try adding a date range to focus on recent applications.');
    }
    
    if (!filters.search && !filters.company) {
      suggestions.push('Add a search term or company filter to find specific positions.');
    }
  }

  // Optimal results suggestions
  if (resultCount > 0 && resultCount <= 20) {
    if (filters.status === PositionStatus.APPLIED) {
      suggestions.push('Great! These are your active applications. Consider following up on older ones.');
    }
    
    if (filters.status === PositionStatus.INTERVIEWING) {
      suggestions.push('These positions are in your interview pipeline. Good luck!');
    }
  }

  return suggestions;
};

/**
 * Optimizes filters for better performance and results
 */
export const optimizeFilters = (filters: PositionFilters): PositionFilters => {
  const optimized = { ...filters };

  // Trim search terms
  if (optimized.search) {
    optimized.search = optimized.search.trim();
    if (optimized.search === '') {
      delete optimized.search;
    }
  }

  // Trim company filter
  if (optimized.company) {
    optimized.company = optimized.company.trim();
    if (optimized.company === '') {
      delete optimized.company;
    }
  }

  // Validate and fix date ranges
  if (optimized.date_from && optimized.date_to) {
    const startDate = new Date(optimized.date_from);
    const endDate = new Date(optimized.date_to);
    
    // Swap dates if they're in wrong order
    if (startDate > endDate) {
      optimized.date_from = endDate.toISOString().split('T')[0];
      optimized.date_to = startDate.toISOString().split('T')[0];
    }
  }

  // Remove empty values
  Object.keys(optimized).forEach(key => {
    const value = optimized[key as keyof PositionFilters];
    if (value === undefined || value === null || value === '') {
      delete optimized[key as keyof PositionFilters];
    }
  });

  return optimized;
};

/**
 * Generates a human-readable description of active filters
 */
export const describeFilters = (filters: PositionFilters): string => {
  const descriptions: string[] = [];

  if (filters.search) {
    descriptions.push(`searching for "${filters.search}"`);
  }

  if (filters.status) {
    const statusLabels: Record<PositionStatus, string> = {
      [PositionStatus.APPLIED]: 'applied positions',
      [PositionStatus.SCREENING]: 'positions in screening',
      [PositionStatus.INTERVIEWING]: 'positions in interview process',
      [PositionStatus.OFFER]: 'positions with offers',
      [PositionStatus.REJECTED]: 'rejected positions',
      [PositionStatus.WITHDRAWN]: 'withdrawn positions',
    };
    descriptions.push(statusLabels[filters.status]);
  }

  if (filters.company) {
    descriptions.push(`at ${filters.company}`);
  }

  if (filters.date_from && filters.date_to) {
    const startDate = new Date(filters.date_from).toLocaleDateString();
    const endDate = new Date(filters.date_to).toLocaleDateString();
    descriptions.push(`applied between ${startDate} and ${endDate}`);
  } else if (filters.date_from) {
    const startDate = new Date(filters.date_from).toLocaleDateString();
    descriptions.push(`applied after ${startDate}`);
  } else if (filters.date_to) {
    const endDate = new Date(filters.date_to).toLocaleDateString();
    descriptions.push(`applied before ${endDate}`);
  }

  if (descriptions.length === 0) {
    return 'showing all positions';
  }

  if (descriptions.length === 1) {
    return descriptions[0];
  }

  if (descriptions.length === 2) {
    return descriptions.join(' and ');
  }

  return descriptions.slice(0, -1).join(', ') + ', and ' + descriptions[descriptions.length - 1];
};

/**
 * Checks if two filter sets are equivalent
 */
export const areFiltersEqual = (filters1: PositionFilters, filters2: PositionFilters): boolean => {
  const keys1 = Object.keys(filters1).sort();
  const keys2 = Object.keys(filters2).sort();

  if (keys1.length !== keys2.length) return false;
  if (keys1.join(',') !== keys2.join(',')) return false;

  return keys1.every(key => {
    const value1 = filters1[key as keyof PositionFilters];
    const value2 = filters2[key as keyof PositionFilters];
    return value1 === value2;
  });
};

/**
 * Merges multiple filter sets with conflict resolution
 */
export const mergeFilters = (...filterSets: PositionFilters[]): PositionFilters => {
  const merged: PositionFilters = {};

  filterSets.forEach(filters => {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        merged[key as keyof PositionFilters] = value;
      }
    });
  });

  return optimizeFilters(merged);
};

export default {
  validateFilters,
  suggestFilterImprovements,
  optimizeFilters,
  describeFilters,
  areFiltersEqual,
  mergeFilters,
};