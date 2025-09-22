import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button, Input } from './';
import { cn } from '../../utils';

export interface DateRange {
  from?: string;
  to?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  presets?: Array<{
    label: string;
    range: DateRange;
  }>;
}

const DEFAULT_PRESETS = [
  {
    label: 'Last 7 days',
    range: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
  },
  {
    label: 'Last 30 days',
    range: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
  },
  {
    label: 'Last 3 months',
    range: {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
  },
  {
    label: 'Last 6 months',
    range: {
      from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
  },
  {
    label: 'This year',
    range: {
      from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
  },
  {
    label: 'Last year',
    range: {
      from: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
      to: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0],
    },
  },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  className,
  presets = DEFAULT_PRESETS,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setTempRange(value); // Reset temp range if cancelled
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, value]);

  // Format date range for display
  const formatDateRange = (range: DateRange): string => {
    if (!range.from && !range.to) return placeholder;
    
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    if (range.from && range.to) {
      return `${formatDate(range.from)} - ${formatDate(range.to)}`;
    } else if (range.from) {
      return `From ${formatDate(range.from)}`;
    } else if (range.to) {
      return `Until ${formatDate(range.to)}`;
    }

    return placeholder;
  };

  // Handle preset selection
  const handlePresetSelect = (preset: { label: string; range: DateRange }) => {
    setTempRange(preset.range);
    onChange(preset.range);
    setIsOpen(false);
  };

  // Handle manual date input
  const handleDateChange = (field: 'from' | 'to', dateStr: string) => {
    const newRange = { ...tempRange, [field]: dateStr || undefined };
    setTempRange(newRange);
  };

  // Apply the temporary range
  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  // Clear the range
  const handleClear = () => {
    const emptyRange = {};
    setTempRange(emptyRange);
    onChange(emptyRange);
    setIsOpen(false);
  };

  // Cancel and reset
  const handleCancel = () => {
    setTempRange(value);
    setIsOpen(false);
  };

  // Check if range has values
  const hasValue = value.from || value.to;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-left',
          'border border-gray-300 rounded-md shadow-sm bg-white',
          'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          hasValue ? 'text-gray-900' : 'text-gray-500'
        )}
      >
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="truncate">{formatDateRange(value)}</span>
        </div>
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg',
            'max-h-96 overflow-y-auto'
          )}
        >
          <div className="p-4 space-y-4">
            {/* Quick Presets */}
            {presets.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Select</h4>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePresetSelect(preset)}
                      className="justify-start text-left h-auto py-2"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Date Inputs */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Range</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={tempRange.from || ''}
                    onChange={(e) => handleDateChange('from', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={tempRange.to || ''}
                    onChange={(e) => handleDateChange('to', e.target.value)}
                    className="w-full"
                    min={tempRange.from} // Prevent selecting end date before start date
                  />
                </div>
              </div>
            </div>

            {/* Validation Message */}
            {tempRange.from && tempRange.to && new Date(tempRange.from) > new Date(tempRange.to) && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                Start date cannot be after end date
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!tempRange.from && !tempRange.to}
              >
                Clear
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  disabled={
                    tempRange.from && tempRange.to && 
                    new Date(tempRange.from) > new Date(tempRange.to)
                  }
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;