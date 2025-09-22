import { rest } from 'msw';
import { Position, Interview, User, PositionStatus, InterviewType, InterviewPlace, InterviewOutcome } from '../../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Mock data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

export const mockPositions: Position[] = [
  {
    id: 'position-1',
    user_id: 'test-user-id',
    title: 'Frontend Developer',
    company: 'Tech Corp',
    description: 'React developer position',
    location: 'San Francisco, CA',
    salary_range: '$80,000 - $120,000',
    status: PositionStatus.APPLIED,
    application_date: '2023-01-15',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z',
    interviews: [],
  },
  {
    id: 'position-2',
    user_id: 'test-user-id',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    description: 'Full stack development role',
    location: 'Remote',
    salary_range: '$90,000 - $130,000',
    status: PositionStatus.INTERVIEWING,
    application_date: '2023-01-20',
    created_at: '2023-01-20T00:00:00Z',
    updated_at: '2023-01-20T00:00:00Z',
    interviews: [],
  },
];

export const mockInterviews: Interview[] = [
  {
    id: 'interview-1',
    position_id: 'position-2',
    type: InterviewType.TECHNICAL,
    place: InterviewPlace.VIDEO,
    scheduled_date: '2023-02-01T10:00:00Z',
    duration_minutes: 60,
    notes: 'Technical interview with the team',
    outcome: InterviewOutcome.PENDING,
    created_at: '2023-01-25T00:00:00Z',
    updated_at: '2023-01-25T00:00:00Z',
  },
];

// Add interviews to positions
mockPositions[1].interviews = [mockInterviews[0]];

export const handlers = [
  // Auth endpoints
  rest.post(`${API_BASE_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        user: mockUser,
      })
    );
  }),

  rest.post(`${API_BASE_URL}/auth/register`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json(mockUser)
    );
  }),

  rest.post(`${API_BASE_URL}/auth/logout`, (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.get(`${API_BASE_URL}/auth/me`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return res(ctx.status(401), ctx.json({ detail: 'Not authenticated' }));
    }
    return res(ctx.status(200), ctx.json(mockUser));
  }),

  // Position endpoints
  rest.get(`${API_BASE_URL}/positions`, (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const search = req.url.searchParams.get('search');
    
    let filteredPositions = [...mockPositions];
    
    if (status) {
      filteredPositions = filteredPositions.filter(p => p.status === status);
    }
    
    if (search) {
      filteredPositions = filteredPositions.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        positions: filteredPositions,
        total: filteredPositions.length,
      })
    );
  }),

  rest.get(`${API_BASE_URL}/positions/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const position = mockPositions.find(p => p.id === id);
    
    if (!position) {
      return res(ctx.status(404), ctx.json({ detail: 'Position not found' }));
    }
    
    return res(ctx.status(200), ctx.json(position));
  }),

  rest.post(`${API_BASE_URL}/positions`, (req, res, ctx) => {
    const newPosition: Position = {
      id: 'new-position-id',
      user_id: 'test-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      interviews: [],
      ...(req.body as any),
    };
    
    mockPositions.push(newPosition);
    return res(ctx.status(201), ctx.json(newPosition));
  }),

  rest.put(`${API_BASE_URL}/positions/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const positionIndex = mockPositions.findIndex(p => p.id === id);
    
    if (positionIndex === -1) {
      return res(ctx.status(404), ctx.json({ detail: 'Position not found' }));
    }
    
    const updatedPosition = {
      ...mockPositions[positionIndex],
      ...(req.body as any),
      updated_at: new Date().toISOString(),
    };
    
    mockPositions[positionIndex] = updatedPosition;
    return res(ctx.status(200), ctx.json(updatedPosition));
  }),

  rest.delete(`${API_BASE_URL}/positions/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const positionIndex = mockPositions.findIndex(p => p.id === id);
    
    if (positionIndex === -1) {
      return res(ctx.status(404), ctx.json({ detail: 'Position not found' }));
    }
    
    mockPositions.splice(positionIndex, 1);
    return res(ctx.status(204));
  }),

  // Interview endpoints
  rest.get(`${API_BASE_URL}/positions/:positionId/interviews`, (req, res, ctx) => {
    const { positionId } = req.params;
    const interviews = mockInterviews.filter(i => i.position_id === positionId);
    
    return res(ctx.status(200), ctx.json(interviews));
  }),

  rest.post(`${API_BASE_URL}/positions/:positionId/interviews`, (req, res, ctx) => {
    const { positionId } = req.params;
    const newInterview: Interview = {
      id: 'new-interview-id',
      position_id: positionId as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(req.body as any),
    };
    
    mockInterviews.push(newInterview);
    return res(ctx.status(201), ctx.json(newInterview));
  }),

  rest.put(`${API_BASE_URL}/interviews/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const interviewIndex = mockInterviews.findIndex(i => i.id === id);
    
    if (interviewIndex === -1) {
      return res(ctx.status(404), ctx.json({ detail: 'Interview not found' }));
    }
    
    const updatedInterview = {
      ...mockInterviews[interviewIndex],
      ...(req.body as any),
      updated_at: new Date().toISOString(),
    };
    
    mockInterviews[interviewIndex] = updatedInterview;
    return res(ctx.status(200), ctx.json(updatedInterview));
  }),

  rest.delete(`${API_BASE_URL}/interviews/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const interviewIndex = mockInterviews.findIndex(i => i.id === id);
    
    if (interviewIndex === -1) {
      return res(ctx.status(404), ctx.json({ detail: 'Interview not found' }));
    }
    
    mockInterviews.splice(interviewIndex, 1);
    return res(ctx.status(204));
  }),

  // Statistics endpoints
  rest.get(`${API_BASE_URL}/statistics/overview`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        total_positions: mockPositions.length,
        total_interviews: mockInterviews.length,
        positions_by_status: {
          [PositionStatus.APPLIED]: mockPositions.filter(p => p.status === PositionStatus.APPLIED).length,
          [PositionStatus.INTERVIEWING]: mockPositions.filter(p => p.status === PositionStatus.INTERVIEWING).length,
          [PositionStatus.OFFER]: mockPositions.filter(p => p.status === PositionStatus.OFFER).length,
          [PositionStatus.REJECTED]: mockPositions.filter(p => p.status === PositionStatus.REJECTED).length,
        },
        interviews_by_outcome: {
          [InterviewOutcome.PENDING]: mockInterviews.filter(i => i.outcome === InterviewOutcome.PENDING).length,
          [InterviewOutcome.PASSED]: mockInterviews.filter(i => i.outcome === InterviewOutcome.PASSED).length,
          [InterviewOutcome.FAILED]: mockInterviews.filter(i => i.outcome === InterviewOutcome.FAILED).length,
        },
      })
    );
  }),

  // Health check
  rest.get(`${API_BASE_URL}/health`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ status: 'healthy' }));
  }),

  // Fallback for unhandled requests
  rest.get('*', (req, res, ctx) => {
    console.warn(`Unhandled GET request: ${req.url}`);
    return res(ctx.status(404), ctx.json({ detail: 'Not found' }));
  }),

  rest.post('*', (req, res, ctx) => {
    console.warn(`Unhandled POST request: ${req.url}`);
    return res(ctx.status(404), ctx.json({ detail: 'Not found' }));
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  rest.get(`${API_BASE_URL}/positions`, (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ detail: 'Internal server error' }));
  }),

  rest.post(`${API_BASE_URL}/auth/login`, (req, res, ctx) => {
    return res(ctx.status(401), ctx.json({ detail: 'Invalid credentials' }));
  }),

  rest.get(`${API_BASE_URL}/positions/:id`, (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ detail: 'Position not found' }));
  }),
];