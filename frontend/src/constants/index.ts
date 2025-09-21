// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: process.env.REACT_APP_APP_NAME || 'Interview Position Tracker',
  VERSION: process.env.REACT_APP_APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_DEVTOOLS: process.env.REACT_APP_ENABLE_DEVTOOLS === 'true',
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  STALE_TIME: parseInt(process.env.REACT_APP_CACHE_STALE_TIME || '300000', 10),
  CACHE_TIME: parseInt(process.env.REACT_APP_CACHE_TIME || '600000', 10),
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  POSITIONS: '/positions',
  POSITION_DETAILS: '/positions/:id',
  STATISTICS: '/statistics',
} as const;
