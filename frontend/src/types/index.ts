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
  confirmPassword?: string; // Optional for API calls, required for forms
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

// Authentication types
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface TokenRefreshResponse {
  access_token: string;
  token_type: string;
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface PositionFormData {
  title: string;
  company: string;
  description?: string;
  location?: string;
  salary_range?: string;
  status: PositionStatus;
  application_date: string;
}

export interface InterviewFormData {
  type: InterviewType;
  place: InterviewPlace;
  scheduled_date: string;
  duration_minutes: number | undefined;
  notes: string;
  outcome: InterviewOutcome;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  terms?: boolean;
}

// API List Response types
export interface PositionListResponse {
  positions: Position[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface InterviewListResponse {
  interviews: Interview[];
  total: number;
}

// Quick update types for inline editing
export interface QuickUpdateData {
  field: string;
  value: any;
}

// User preferences and settings
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultPositionStatus: PositionStatus;
  defaultInterviewType: InterviewType;
  defaultInterviewPlace: InterviewPlace;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timezone: string;
}

// Cache and offline types
export interface CacheMetadata {
  timestamp: number;
  version: string;
  ttl: number;
}

export interface OfflineQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'position' | 'interview';
  data: any;
  timestamp: number;
  retryCount: number;
}

// UI State types
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
}

// Notification types
export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  loading: boolean;
  error?: string | null;
}

// Search and filter types
export interface SearchState {
  query: string;
  filters: PositionFilters;
  sortBy: 'created_at' | 'updated_at' | 'application_date' | 'title' | 'company';
  sortOrder: 'asc' | 'desc';
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

// Export utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Re-export validation types
export * from './validation';
