import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { DateRangePicker } from '../ui/DateRangePicker';

interface DateRange {
  from: string;
  to: string;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

const PRESET_RANGES = [
  {
    label: 'Last 7 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return {
        from: start.toISOString().split('T')[0] || '',
        to: end.toISOString().split('T')[0] || '',
      };
    },
  },
  {
    label: 'Last 30 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return {
        from: start.toISOString().split('T')[0] || '',
        to: end.toISOString().split('T')[0] || '',
      };
    },
  },
  {
    label: 'Last 90 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return {
        from: start.toISOString().split('T')[0] || '',
        to: end.toISOString().split('T')[0] || '',
      };
    },
  },
  {
    label: 'This year',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date();
      return {
        from: start.toISOString().split('T')[0] || '',
        to: end.toISOString().split('T')[0] || '',
      };
    },
  },
  {
    label: 'Last year',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return {
        from: start.toISOString().split('T')[0] || '',
        to: end.toISOString().split('T')[0] || '',
      };
    },
  },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  onApply,
  onReset,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetSelect = (preset: typeof PRESET_RANGES[0]) => {
    const range = preset.getValue();
    onChange(range);
  };

  const formatDateRange = (range: DateRange) => {
    if (!range.from || !range.to) {
      return 'Select date range';
    }
    
    const fromDate = new Date(range.from);
    const toDate = new Date(range.to);
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: fromDate.getFullYear() !== toDate.getFullYear() ? 'numeric' : undefined,
    };
    
    return `${fromDate.toLocaleDateString('en-US', formatOptions)} - ${toDate.toLocaleDateString('en-US', formatOptions)}`;
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2"
          disabled={isLoading}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>{formatDateRange(value)}</span>
        </Button>
        
        {(value.from || value.to) && (
          <>
            <Button
              variant="primary"
              onClick={onApply}
              disabled={isLoading || !value.from || !value.to}
              size="sm"
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              onClick={onReset}
              disabled={isLoading}
              size="sm"
            >
              Reset
            </Button>
          </>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-80">
          <div className="space-y-4">
            {/* Preset ranges */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Select</h4>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_RANGES.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePresetSelect(preset)}
                    className="justify-start text-left"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom date range */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Custom Range</h4>
              <DateRangePicker
                value={value}
                onChange={onChange}
                placeholder="Select custom date range"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <div className="space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onReset();
                    setIsOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onApply();
                    setIsOpen(false);
                  }}
                  disabled={!value.from || !value.to}
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