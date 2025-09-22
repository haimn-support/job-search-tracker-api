import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface InlineDatePickerProps {
  value: string;
  onSave: (newDate: string) => void;
  onCancel: () => void;
  loading?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const InlineDatePicker: React.FC<InlineDatePickerProps> = ({
  value,
  onSave,
  onCancel,
  loading = false,
  minDate,
  maxDate,
  className = '',
}) => {
  const [tempValue, setTempValue] = useState(() => {
    // Convert ISO string to datetime-local format
    const date = new Date(value);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  });
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    if (!tempValue) {
      setError('Date is required');
      return;
    }

    // Validate date
    const selectedDate = new Date(tempValue);

    if (minDate && selectedDate < new Date(minDate)) {
      setError('Date cannot be before minimum date');
      return;
    }

    if (maxDate && selectedDate > new Date(maxDate)) {
      setError('Date cannot be after maximum date');
      return;
    }

    // Convert back to ISO string
    const isoString = selectedDate.toISOString();
    onSave(isoString);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
    setError(''); // Clear error when user types
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="datetime-local"
          value={tempValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          min={minDate ? format(new Date(minDate), "yyyy-MM-dd'T'HH:mm") : undefined}
          max={maxDate ? format(new Date(maxDate), "yyyy-MM-dd'T'HH:mm") : undefined}
          className={`px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={loading}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap">
            {error}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSave}
        disabled={loading || !tempValue}
        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <CheckIcon className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={loading}
        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <XMarkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default InlineDatePicker;