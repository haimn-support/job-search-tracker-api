import { Position, Interview, User, PositionStatus, InterviewType, InterviewPlace, InterviewOutcome } from '../types';

// Factory functions for creating test data
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

export const createMockPosition = (overrides: Partial<Position> = {}): Position => ({
  id: 'test-position-id',
  user_id: 'test-user-id',
  title: 'Software Engineer',
  company: 'Test Company',
  description: 'Test position description',
  location: 'Test City, TC',
  salary_range: '$80,000 - $120,000',
  status: PositionStatus.APPLIED,
  application_date: '2023-01-15',
  created_at: '2023-01-15T00:00:00Z',
  updated_at: '2023-01-15T00:00:00Z',
  interviews: [],
  ...overrides,
});

export const createMockInterview = (overrides: Partial<Interview> = {}): Interview => ({
  id: 'test-interview-id',
  position_id: 'test-position-id',
  type: InterviewType.TECHNICAL,
  place: InterviewPlace.VIDEO,
  scheduled_date: '2023-02-01T10:00:00Z',
  duration_minutes: 60,
  notes: 'Test interview notes',
  outcome: InterviewOutcome.PENDING,
  created_at: '2023-01-25T00:00:00Z',
  updated_at: '2023-01-25T00:00:00Z',
  ...overrides,
});

// Collections of test data
export const mockUsers = {
  john: createMockUser({
    id: 'user-john',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
  }),
  jane: createMockUser({
    id: 'user-jane',
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
  }),
};

export const mockPositions = {
  frontend: createMockPosition({
    id: 'position-frontend',
    title: 'Frontend Developer',
    company: 'Tech Corp',
    status: PositionStatus.APPLIED,
  }),
  fullstack: createMockPosition({
    id: 'position-fullstack',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    status: PositionStatus.INTERVIEWING,
  }),
  senior: createMockPosition({
    id: 'position-senior',
    title: 'Senior Software Engineer',
    company: 'Big Tech Inc',
    status: PositionStatus.OFFER,
  }),
  rejected: createMockPosition({
    id: 'position-rejected',
    title: 'Backend Developer',
    company: 'Another Corp',
    status: PositionStatus.REJECTED,
  }),
};

export const mockInterviews = {
  technical: createMockInterview({
    id: 'interview-technical',
    position_id: 'position-fullstack',
    type: InterviewType.TECHNICAL,
    place: InterviewPlace.VIDEO,
    outcome: InterviewOutcome.PASSED,
  }),
  behavioral: createMockInterview({
    id: 'interview-behavioral',
    position_id: 'position-fullstack',
    type: InterviewType.BEHAVIORAL,
    place: InterviewPlace.ONSITE,
    outcome: InterviewOutcome.PENDING,
  }),
  hr: createMockInterview({
    id: 'interview-hr',
    position_id: 'position-senior',
    type: InterviewType.HR,
    place: InterviewPlace.PHONE,
    outcome: InterviewOutcome.PASSED,
  }),
  final: createMockInterview({
    id: 'interview-final',
    position_id: 'position-senior',
    type: InterviewType.FINAL,
    place: InterviewPlace.ONSITE,
    outcome: InterviewOutcome.PENDING,
  }),
};

// Add interviews to positions
mockPositions.fullstack.interviews = [mockInterviews.technical, mockInterviews.behavioral];
mockPositions.senior.interviews = [mockInterviews.hr, mockInterviews.final];

// Statistics mock data
export const mockStatistics = {
  overview: {
    total_positions: 4,
    total_interviews: 4,
    positions_by_status: {
      [PositionStatus.APPLIED]: 1,
      [PositionStatus.SCREENING]: 0,
      [PositionStatus.INTERVIEWING]: 1,
      [PositionStatus.OFFER]: 1,
      [PositionStatus.REJECTED]: 1,
      [PositionStatus.WITHDRAWN]: 0,
    },
    interviews_by_outcome: {
      [InterviewOutcome.PENDING]: 2,
      [InterviewOutcome.PASSED]: 2,
      [InterviewOutcome.FAILED]: 0,
      [InterviewOutcome.CANCELLED]: 0,
    },
    interviews_by_type: {
      [InterviewType.TECHNICAL]: 1,
      [InterviewType.BEHAVIORAL]: 1,
      [InterviewType.HR]: 1,
      [InterviewType.FINAL]: 1,
    },
    company_stats: [
      { company: 'Tech Corp', positions: 1, interviews: 0 },
      { company: 'StartupXYZ', positions: 1, interviews: 2 },
      { company: 'Big Tech Inc', positions: 1, interviews: 2 },
      { company: 'Another Corp', positions: 1, interviews: 0 },
    ],
  },
};

// Form data for testing
export const mockFormData = {
  position: {
    title: 'Test Position',
    company: 'Test Company',
    description: 'Test description',
    location: 'Test Location',
    salary_range: '$50,000 - $70,000',
    status: PositionStatus.APPLIED,
    application_date: '2023-01-15',
  },
  interview: {
    type: InterviewType.TECHNICAL,
    place: InterviewPlace.VIDEO,
    scheduled_date: '2023-02-01T10:00:00Z',
    duration_minutes: 60,
    notes: 'Test notes',
    outcome: InterviewOutcome.PENDING,
  },
  auth: {
    login: {
      email: 'test@example.com',
      password: 'password123',
    },
    register: {
      email: 'newuser@example.com',
      password: 'password123',
      first_name: 'New',
      last_name: 'User',
    },
  },
};

// Error responses for testing
export const mockErrors = {
  validation: {
    detail: 'Validation error',
    field_errors: {
      title: 'Title is required',
      email: 'Invalid email format',
    },
  },
  authentication: {
    detail: 'Invalid credentials',
  },
  notFound: {
    detail: 'Resource not found',
  },
  serverError: {
    detail: 'Internal server error',
  },
  network: {
    message: 'Network error',
    code: 'NETWORK_ERROR',
  },
};