import { PositionFilters } from '../types';
import { FilterPreset } from '../components/positions/FilterPresets';

export interface ExportedFilters {
  version: string;
  timestamp: string;
  filters: PositionFilters;
  metadata?: {
    name?: string;
    description?: string;
    resultCount?: number;
    exportedBy?: string;
  };
}

export interface ExportedFilterCollection {
  version: string;
  timestamp: string;
  presets: FilterPreset[];
  metadata?: {
    name?: string;
    description?: string;
    exportedBy?: string;
  };
}

/**
 * Export filters to JSON format
 */
export const exportFiltersToJSON = (
  filters: PositionFilters,
  metadata?: ExportedFilters['metadata']
): string => {
  const exportData: ExportedFilters = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    filters,
    metadata,
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Export filter presets collection to JSON
 */
export const exportPresetsToJSON = (
  presets: FilterPreset[],
  metadata?: ExportedFilterCollection['metadata']
): string => {
  const exportData: ExportedFilterCollection = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    presets,
    metadata,
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Import filters from JSON string
 */
export const importFiltersFromJSON = (jsonString: string): PositionFilters => {
  try {
    const data = JSON.parse(jsonString) as ExportedFilters;
    
    if (!data.version || !data.filters) {
      throw new Error('Invalid filter export format');
    }

    // Validate filter structure
    const validKeys = ['status', 'company', 'search', 'date_from', 'date_to'];
    const filters: PositionFilters = {};

    Object.entries(data.filters).forEach(([key, value]) => {
      if (validKeys.includes(key) && value !== undefined && value !== null && value !== '') {
        filters[key as keyof PositionFilters] = value;
      }
    });

    return filters;
  } catch (error) {
    throw new Error('Failed to import filters: Invalid JSON format');
  }
};

/**
 * Import filter presets from JSON string
 */
export const importPresetsFromJSON = (jsonString: string): FilterPreset[] => {
  try {
    const data = JSON.parse(jsonString) as ExportedFilterCollection;
    
    if (!data.version || !data.presets || !Array.isArray(data.presets)) {
      throw new Error('Invalid preset collection format');
    }

    // Validate and clean presets
    return data.presets.map((preset, index) => ({
      id: preset.id || `imported-${Date.now()}-${index}`,
      name: preset.name || `Imported Preset ${index + 1}`,
      filters: preset.filters || {},
      isDefault: false, // Imported presets are never default
      created_at: preset.created_at || new Date().toISOString(),
      usage_count: 0, // Reset usage count for imported presets
    }));
  } catch (error) {
    throw new Error('Failed to import presets: Invalid JSON format');
  }
};

/**
 * Export filters to URL format
 */
export const exportFiltersToURL = (filters: PositionFilters, baseUrl?: string): string => {
  const url = new URL(baseUrl || window.location.href);
  
  // Clear existing filter params
  const filterKeys = ['status', 'company', 'search', 'date_from', 'date_to'];
  filterKeys.forEach(key => url.searchParams.delete(key));

  // Add current filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

/**
 * Import filters from URL
 */
export const importFiltersFromURL = (url: string): PositionFilters => {
  try {
    const urlObj = new URL(url);
    const filters: PositionFilters = {};

    const status = urlObj.searchParams.get('status');
    const company = urlObj.searchParams.get('company');
    const search = urlObj.searchParams.get('search');
    const dateFrom = urlObj.searchParams.get('date_from');
    const dateTo = urlObj.searchParams.get('date_to');

    if (status) filters.status = status as any;
    if (company) filters.company = company;
    if (search) filters.search = search;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;

    return filters;
  } catch (error) {
    throw new Error('Failed to import filters from URL: Invalid URL format');
  }
};

/**
 * Download filters as JSON file
 */
export const downloadFiltersAsFile = (
  filters: PositionFilters,
  filename?: string,
  metadata?: ExportedFilters['metadata']
): void => {
  const jsonString = exportFiltersToJSON(filters, metadata);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `position-filters-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download presets as JSON file
 */
export const downloadPresetsAsFile = (
  presets: FilterPreset[],
  filename?: string,
  metadata?: ExportedFilterCollection['metadata']
): void => {
  const jsonString = exportPresetsToJSON(presets, metadata);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `filter-presets-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Read filters from uploaded file
 */
export const readFiltersFromFile = (file: File): Promise<PositionFilters> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const filters = importFiltersFromJSON(jsonString);
        resolve(filters);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Read presets from uploaded file
 */
export const readPresetsFromFile = (file: File): Promise<FilterPreset[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const presets = importPresetsFromJSON(jsonString);
        resolve(presets);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Generate shareable filter link with optional expiration
 */
export const generateShareableLink = (
  filters: PositionFilters,
  options?: {
    baseUrl?: string;
    includeTimestamp?: boolean;
    customParams?: Record<string, string>;
  }
): string => {
  const url = new URL(options?.baseUrl || window.location.origin + window.location.pathname);
  
  // Add filters to URL
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  // Add timestamp if requested
  if (options?.includeTimestamp) {
    url.searchParams.set('shared_at', new Date().toISOString());
  }

  // Add custom parameters
  if (options?.customParams) {
    Object.entries(options.customParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
};

/**
 * Create a QR code data URL for sharing filters
 */
export const createFilterQRCode = async (filters: PositionFilters): Promise<string> => {
  const url = generateShareableLink(filters);
  
  // This would typically use a QR code library like 'qrcode'
  // For now, we'll return a placeholder or use a service
  try {
    // Using a free QR code API service
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    return qrApiUrl;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Validate imported filter data
 */
export const validateImportedFilters = (filters: PositionFilters): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check date formats
  if (filters.date_from && !/^\d{4}-\d{2}-\d{2}$/.test(filters.date_from)) {
    errors.push('Invalid date format for date_from. Expected YYYY-MM-DD.');
  }

  if (filters.date_to && !/^\d{4}-\d{2}-\d{2}$/.test(filters.date_to)) {
    errors.push('Invalid date format for date_to. Expected YYYY-MM-DD.');
  }

  // Check date logic
  if (filters.date_from && filters.date_to) {
    if (new Date(filters.date_from) > new Date(filters.date_to)) {
      errors.push('Start date cannot be after end date.');
    }
  }

  // Check for future dates
  const today = new Date().toISOString().split('T')[0];
  if (filters.date_from && filters.date_from > today) {
    warnings.push('Start date is in the future.');
  }
  if (filters.date_to && filters.date_to > today) {
    warnings.push('End date is in the future.');
  }

  // Check string lengths
  if (filters.search && filters.search.length > 100) {
    warnings.push('Search term is very long and might not return results.');
  }

  if (filters.company && filters.company.length > 50) {
    warnings.push('Company name is very long.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export default {
  exportFiltersToJSON,
  exportPresetsToJSON,
  importFiltersFromJSON,
  importPresetsFromJSON,
  exportFiltersToURL,
  importFiltersFromURL,
  downloadFiltersAsFile,
  downloadPresetsAsFile,
  readFiltersFromFile,
  readPresetsFromFile,
  generateShareableLink,
  createFilterQRCode,
  validateImportedFilters,
};