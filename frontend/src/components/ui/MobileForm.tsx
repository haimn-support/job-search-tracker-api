import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

// Mobile-optimized form container
export const MobileForm: React.FC<{
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}> = ({ children, className, onSubmit }) => {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'space-y-4 sm:space-y-6',
        // Add padding for mobile keyboards
        'pb-20 sm:pb-6',
        className
      )}
    >
      {children}
    </form>
  );
};

// Mobile-optimized input with better touch targets
export const MobileInput: React.FC<{
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
} & React.InputHTMLAttributes<HTMLInputElement>> = ({
  label,
  error,
  helperText,
  icon,
  rightIcon,
  onRightIconClick,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{icon}</div>
          </div>
        )}
        
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            // Base styles
            'block w-full rounded-lg border border-gray-300 bg-white text-base sm:text-sm',
            // Mobile-optimized sizing
            'h-12 sm:h-10 px-4 py-3 sm:py-2',
            // Icon padding
            icon && 'pl-10',
            rightIcon && 'pr-10',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            // Error styles
            error && 'border-red-500 focus:ring-red-500',
            // Focus animation
            isFocused && 'transform scale-[1.02] sm:scale-100',
            'transition-all duration-200 ease-out',
            // Touch optimization
            'touch-manipulation',
            className
          )}
        />
        
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute inset-y-0 right-0 pr-3 flex items-center touch-manipulation"
          >
            <div className="text-gray-400 hover:text-gray-600">{rightIcon}</div>
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};

// Mobile-optimized textarea
export const MobileTextArea: React.FC<{
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  label,
  error,
  helperText,
  autoResize = false,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
    props.onInput?.(e);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        {...props}
        onInput={handleInput}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          // Base styles
          'block w-full rounded-lg border border-gray-300 bg-white text-base sm:text-sm',
          // Mobile-optimized sizing
          'min-h-[120px] sm:min-h-[80px] px-4 py-3 sm:py-2',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          // Error styles
          error && 'border-red-500 focus:ring-red-500',
          // Focus animation
          isFocused && 'transform scale-[1.02] sm:scale-100',
          'transition-all duration-200 ease-out',
          // Resize behavior
          autoResize ? 'resize-none' : 'resize-y',
          // Touch optimization
          'touch-manipulation',
          className
        )}
      />
      
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};

// Mobile-optimized select
export const MobileSelect: React.FC<{
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            // Base styles
            'block w-full rounded-lg border border-gray-300 bg-white text-base sm:text-sm appearance-none',
            // Mobile-optimized sizing
            'h-12 sm:h-10 px-4 py-3 sm:py-2 pr-10',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            // Error styles
            error && 'border-red-500 focus:ring-red-500',
            // Focus animation
            isFocused && 'transform scale-[1.02] sm:scale-100',
            'transition-all duration-200 ease-out',
            // Touch optimization
            'touch-manipulation',
            className
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};

// Mobile-optimized form actions
export const MobileFormActions: React.FC<{
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}> = ({ children, className, sticky = false }) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-3 sm:gap-4',
        sticky && [
          'sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:mx-0 sm:relative sm:border-0 sm:p-0 sm:bg-transparent',
          'shadow-lg sm:shadow-none',
        ],
        className
      )}
    >
      {children}
    </div>
  );
};

export default {
  MobileForm,
  MobileInput,
  MobileTextArea,
  MobileSelect,
  MobileFormActions,
};