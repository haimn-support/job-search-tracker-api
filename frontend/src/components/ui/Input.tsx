import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-11 sm:h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          aria-describedby={error ? errorId : helperTextId}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600" role="alert" id={errorId}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500" id={helperTextId}>{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;