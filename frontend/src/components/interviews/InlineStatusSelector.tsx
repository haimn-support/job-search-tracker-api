import React, { useState, useRef, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { InterviewOutcome } from '../../types';
import { Button } from '../ui/Button';


interface InlineStatusSelectorProps {
  value: InterviewOutcome;
  onSave: (newStatus: InterviewOutcome) => void;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

const InlineStatusSelector: React.FC<InlineStatusSelectorProps> = ({
  value,
  onSave,
  onCancel,
  loading = false,
  className = '',
}) => {
  const [tempValue, setTempValue] = useState<InterviewOutcome>(value);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    // Focus the select when component mounts
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    onSave(tempValue);
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

  const statusOptions = [
    { value: InterviewOutcome.PENDING, label: 'Pending' },
    { value: InterviewOutcome.PASSED, label: 'Passed' },
    { value: InterviewOutcome.FAILED, label: 'Failed' },
    { value: InterviewOutcome.CANCELLED, label: 'Cancelled' },
  ];

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <select
        ref={selectRef}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value as InterviewOutcome)}
        onKeyDown={handleKeyDown}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={loading}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSave}
        disabled={loading || tempValue === value}
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

export default InlineStatusSelector;