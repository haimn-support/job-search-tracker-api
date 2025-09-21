// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
Object.assign(process.env, {
  REACT_APP_API_BASE_URL: 'http://localhost:8000',
  REACT_APP_API_TIMEOUT: '10000',
  REACT_APP_APP_NAME: 'Interview Position Tracker',
  REACT_APP_APP_VERSION: '1.0.0',
  REACT_APP_ENABLE_DEVTOOLS: 'false',
  REACT_APP_ENABLE_ANALYTICS: 'false',
  REACT_APP_CACHE_STALE_TIME: '300000',
  REACT_APP_CACHE_TIME: '600000',
  REACT_APP_ENVIRONMENT: 'test',
});
