// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
}

// Position types
export enum PositionStatus {
  APPLIED = 'applied',
  SCREENING = 'screening',
  INTERVIEWING = 'interviewing',
  OFFER = 'offer',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface Position extends BaseEntity {
  user_id: string;
  title: string;
  company: string;
  description?: string;
  location?: string;
  salary_range?: string;
  status: PositionStatus;
  application_date: string;
  interviews: Interview[];
}

// Interview types
export enum InterviewType {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  HR = 'hr',
  FINAL = 'final',
}

export enum InterviewPlace {
  PHONE = 'phone',
  VIDEO = 'video',
  ONSITE = 'onsite',
}

export enum InterviewOutcome {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Interview extends BaseEntity {
  position_id: string;
  type: InterviewType;
  place: InterviewPlace;
  scheduled_date: string;
  duration_minutes?: number;
  notes?: string;
  outcome: InterviewOutcome;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  code: string;
  message: string;
  field_errors?: Record<string, string>;
  timestamp: string;
}

// Form types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface CreatePositionData {
  title: string;
  company: string;
  description?: string;
  location?: string;
  salary_range?: string;
  status: PositionStatus;
  application_date: string;
}

export interface UpdatePositionData extends Partial<CreatePositionData> {}

export interface CreateInterviewData {
  position_id: string;
  type: InterviewType;
  place: InterviewPlace;
  scheduled_date: string;
  duration_minutes?: number;
  notes?: string;
  outcome: InterviewOutcome;
}

export interface UpdateInterviewData extends Partial<CreateInterviewData> {}

// Filter types
export interface PositionFilters {
  status?: PositionStatus;
  company?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// Statistics types
export interface PositionStatistics {
  total_positions: number;
  positions_by_status: Record<PositionStatus, number>;
  total_interviews: number;
  interviews_by_outcome: Record<InterviewOutcome, number>;
  interviews_by_type: Record<InterviewType, number>;
  companies: Array<{
    name: string;
    position_count: number;
    interview_count: number;
  }>;
}
