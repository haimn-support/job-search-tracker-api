import { PositionStatus, InterviewType, InterviewPlace, InterviewOutcome } from './index';

// Validation schema types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData?: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Position validation schema
export const positionValidationSchema: ValidationSchema = {
  title: {
    required: true,
    minLength: 2,
    maxLength: 200,
  },
  company: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  description: {
    maxLength: 2000,
  },
  location: {
    maxLength: 100,
  },
  salary_range: {
    maxLength: 50,
  },
  status: {
    required: true,
    custom: (value) => {
      if (!Object.values(PositionStatus).includes(value)) {
        return 'Invalid position status';
      }
      return null;
    },
  },
  application_date: {
    required: true,
    custom: (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date format';
      }
      if (date > new Date()) {
        return 'Application date cannot be in the future';
      }
      return null;
    },
  },
};

// Interview validation schema
export const interviewValidationSchema: ValidationSchema = {
  type: {
    required: true,
    custom: (value) => {
      if (!Object.values(InterviewType).includes(value)) {
        return 'Invalid interview type';
      }
      return null;
    },
  },
  place: {
    required: true,
    custom: (value) => {
      if (!Object.values(InterviewPlace).includes(value)) {
        return 'Invalid interview place';
      }
      return null;
    },
  },
  scheduled_date: {
    required: true,
    custom: (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date format';
      }
      return null;
    },
  },
  duration_minutes: {
    custom: (value) => {
      if (value !== undefined && value !== null) {
        const num = Number(value);
        if (isNaN(num) || num < 0 || num > 480) {
          return 'Duration must be between 0 and 480 minutes';
        }
      }
      return null;
    },
  },
  notes: {
    maxLength: 2000,
  },
  outcome: {
    required: true,
    custom: (value) => {
      if (!Object.values(InterviewOutcome).includes(value)) {
        return 'Invalid interview outcome';
      }
      return null;
    },
  },
};

// User registration validation schema
export const registerValidationSchema: ValidationSchema = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    custom: (value) => {
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
      }
      return null;
    },
  },
  confirmPassword: {
    required: true,
    custom: (value, formData) => {
      if (value !== formData?.password) {
        return 'Passwords do not match';
      }
      return null;
    },
  },
  first_name: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
  last_name: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
};

// Login validation schema
export const loginValidationSchema: ValidationSchema = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 1,
  },
};

// Validation utility functions
export const validateField = (
  value: any,
  rule: ValidationRule,
  formData?: any
): string | null => {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return 'This field is required';
  }

  // Skip other validations if value is empty and not required
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Check minLength
  if (rule.minLength && value.length < rule.minLength) {
    return `Minimum length is ${rule.minLength} characters`;
  }

  // Check maxLength
  if (rule.maxLength && value.length > rule.maxLength) {
    return `Maximum length is ${rule.maxLength} characters`;
  }

  // Check pattern
  if (rule.pattern && !rule.pattern.test(value)) {
    return 'Invalid format';
  }

  // Check custom validation
  if (rule.custom) {
    return rule.custom(value, formData);
  }

  return null;
};

export const validateForm = (
  formData: any,
  schema: ValidationSchema
): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  Object.keys(schema).forEach((field) => {
    const rule = schema[field];
    if (rule) {
      const error = validateField(formData[field], rule, formData);
      if (error) {
        errors[field] = error;
      }
    }
  });

  return errors;
};

export const isFormValid = (errors: { [key: string]: string }): boolean => {
  return Object.keys(errors).length === 0;
};