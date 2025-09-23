# Interview Position Tracker Frontend

A modern React TypeScript application for managing job applications and interview processes. This frontend provides an intuitive interface for tracking job positions, managing interviews, and analyzing job search progress.

## Features

### 🔐 **Authentication & Security**
- Secure user registration and login
- JWT token-based authentication
- Protected routes and session management
- Automatic token refresh and logout

### 📋 **Position Management**
- Create, edit, and delete job positions
- Track application status and progress
- Rich position details with company information
- Application date tracking and status updates

### 🎯 **Interview Management**
- **Comprehensive Interview Tracking**: Create, edit, and delete interviews with detailed information
- **Multiple Interview Types**: Support for HR, Technical, Behavioral, and Final interviews
- **Interview Formats**: Track phone, video, and on-site interviews
- **Smart Scheduling**: Date/time scheduling with validation and conflict detection
- **Outcome Management**: Track pending, passed, failed, and cancelled interview outcomes
- **Inline Editing**: Quick edit dates and status directly from cards
- **Quick Actions**: Fast operations like marking as passed/failed, rescheduling, and canceling
- **Visual Indicators**: Color-coded status, overdue warnings, and today's interview highlights
- **Interview Tooltips**: Hover previews with detailed interview information
- **Filtering & Sorting**: Advanced filtering by type, outcome, and timeframe with multiple sort options

### 📊 **Statistics & Analytics Dashboard**
- **Interactive Data Visualization**: Professional charts with Chart.js integration and drill-down capabilities
- **Key Performance Metrics**: Success rates, conversion funnels, and comprehensive KPI tracking
- **Advanced Filtering**: Date range selection with presets and real-time statistics updates
- **Export Capabilities**: Export statistics in JSON/CSV formats with comprehensive reporting
- **Mobile-Optimized**: Responsive charts and analytics optimized for all device sizes
- **Drill-Down Analysis**: Click on charts and tables for detailed breakdowns and insights

### 🔍 **Advanced Search & Filtering System**
- **Smart Filter Presets**: Default and custom presets with usage tracking and popularity sorting
- **Enhanced Date Range Picker**: Quick select options (7 days, 30 days, 3 months, etc.) with custom range support
- **Intelligent Validation**: Real-time filter validation with smart suggestions and error prevention
- **Import/Export**: Save and share filter configurations via JSON files or shareable URLs
- **Multi-field Search**: Full-text search across positions, companies, and descriptions with debounced input
- **Filter Persistence**: URL-based filter state for bookmarking and sharing
- **Visual Feedback**: Clear filter descriptions, active counts, and one-click clearing
- **QR Code Sharing**: Generate QR codes for mobile filter sharing

### 🛡️ **Error Handling & User Feedback System**

The application features a comprehensive error handling and user feedback system designed to provide a smooth, reliable user experience with clear communication and recovery options:

#### **Global Error Boundaries**
- **Application-Level Protection**: Global error boundary catches unhandled React errors and prevents app crashes
- **Feature-Specific Boundaries**: Isolated error handling for positions, interviews, statistics, and forms
- **Graceful Degradation**: Fallback UI components with retry options and navigation alternatives
- **Development Support**: Detailed error information in development mode with stack traces

#### **Intelligent Retry Mechanisms**
- **Automatic API Retries**: Failed requests automatically retry with exponential backoff (configurable 1-3 attempts)
- **Network-Aware Retries**: Different retry strategies for network errors vs. server errors
- **Smart Retry Logic**: Avoids retrying client errors (4xx) while retrying server errors (5xx) and network issues
- **User-Controlled Retries**: Manual retry buttons in error displays and notifications

#### **User-Friendly Error Messages**
- **Contextual Error Messages**: Over 20 predefined error types with user-friendly explanations
- **Actionable Recovery Options**: Error messages include specific actions users can take
- **Field-Level Validation**: Form errors show exactly which fields need attention
- **Progressive Error Disclosure**: Simple messages with expandable details for technical users

#### **Comprehensive Notification System**
- **Toast Notifications**: Non-intrusive notifications for success, error, warning, and info messages
- **Promise-Based Notifications**: Automatic loading → success/error flow for async operations
- **Persistent Notifications**: Important errors stay visible until dismissed
- **Actionable Notifications**: Notifications can include action buttons for immediate response

#### **Advanced Loading States**
- **Multiple Loading Indicators**: Spinners, dots, progress bars, and skeleton screens
- **Context-Aware Loading**: Different loading states for buttons, forms, pages, and data lists
- **Loading Overlays**: Non-blocking loading states that preserve user context
- **Progress Tracking**: Multi-step processes show clear progress indicators

#### **Network Status Management**
- **Offline Detection**: Automatic detection of network connectivity changes
- **Offline Indicators**: Persistent banner showing offline status with connection quality info
- **Offline Queue**: Failed requests are queued and automatically retried when connection returns
- **Connection Quality**: Displays connection type (2G, 3G, 4G, WiFi) and adapts behavior accordingly

#### **Success Confirmations**
- **Modal Confirmations**: Important actions show success modals with auto-close timers
- **Inline Success Messages**: Quick feedback for form submissions and updates
- **Success Banners**: Page-level success messages with optional action buttons
- **Auto-Dismissing Feedback**: Success messages automatically fade after appropriate time

#### **Feedback Hooks & Utilities**
- **Unified Feedback Management**: `useFeedback` hook provides consistent error/loading/success state
- **Form-Specific Feedback**: `useFormFeedback` optimized for form submission workflows
- **Operation-Specific Feedback**: Specialized hooks for delete operations, async operations, etc.
- **Loading State Management**: Track multiple concurrent loading states with unique keys

#### **Error Recovery Features**
- **Smart Recovery Actions**: Context-aware recovery options (refresh, retry, navigate, login)
- **Error Classification**: Automatic categorization of errors by type, severity, and recoverability
- **Fallback Navigation**: Error states provide alternative navigation paths
- **Session Recovery**: Automatic token refresh and session restoration

#### **Technical Implementation**
```typescript
// Example usage of the error handling system
const { loading, error, handleAsyncOperation } = useFeedback();

const handleSubmit = async (data) => {
  await handleAsyncOperation(
    () => createPosition(data),
    {
      loadingMessage: 'Creating position...',
      successMessage: 'Position created successfully!',
      showSuccessConfirmation: true,
      confirmationActions: [
        { label: 'Add Interview', action: () => navigate('/interviews/create') },
        { label: 'View Position', action: () => navigate(`/positions/${result.id}`) }
      ]
    }
  );
};
```

### 📱 **Mobile-First Responsive Design**

The application features comprehensive mobile optimization with native-like interactions and performance:

#### **Responsive Layout System**
- **Mobile-First Architecture**: Built with mobile devices as the primary target, progressively enhancing for larger screens
- **Adaptive Grid Layouts**: Dynamic grid systems that scale from 1 column on mobile to 4 columns on desktop
- **Flexible Navigation**: Collapsible sidebar with smooth animations and touch-friendly interactions
- **Responsive Typography**: Fluid text sizing that adapts to screen size and user preferences

#### **Advanced Touch Interactions**
- **Swipe Gestures**: Swipe left/right on position cards for quick actions (edit position, add interview)
- **Pull-to-Refresh**: Native-like pull-to-refresh functionality with visual feedback and smooth animations
- **Touch Feedback**: Visual and haptic feedback for all touch interactions with active states
- **Gesture Navigation**: Swipe from screen edge to open/close sidebar navigation
- **Multi-Touch Support**: Optimized for various touch patterns and gestures

#### **Mobile-Optimized Components**
- **Enhanced Forms**: Larger input fields (44px minimum touch targets), better keyboard handling, and sticky action buttons
- **Smart Modals**: Bottom-sheet style modals on mobile with improved accessibility and gesture support
- **Loading States**: Mobile-specific loading indicators, skeleton screens, and progress bars
- **Swipeable Cards**: Position cards with swipe actions for quick operations
- **Touch-Friendly Buttons**: Optimized button sizes with proper spacing and visual feedback

#### **Performance Optimizations**
- **Lazy Loading**: Images and components load only when needed using Intersection Observer API
- **Progressive Image Loading**: Blur-to-sharp transitions with multiple quality levels
- **Optimized Animations**: Hardware-accelerated animations with reduced motion support
- **Network Awareness**: Adaptive loading strategies based on connection quality
- **Memory Management**: Efficient component rendering and cleanup for mobile devices

#### **Mobile UX Enhancements**
- **Pull-to-Refresh**: Implemented across data lists with customizable threshold and resistance
- **Swipe Actions**: Quick actions on cards without opening menus
- **Keyboard Optimization**: Better mobile keyboard handling with appropriate input types
- **Viewport Management**: Proper viewport handling for iOS Safari and Android Chrome
- **Touch Target Sizing**: All interactive elements meet WCAG 2.1 AA guidelines (44px minimum)

#### **Responsive Breakpoints**
```css
/* Tailwind CSS breakpoints used throughout the application */
xs: 475px    /* Extra small devices */
sm: 640px    /* Small devices (phones) */
md: 768px    /* Medium devices (tablets) */
lg: 1024px   /* Large devices (laptops) */
xl: 1280px   /* Extra large devices (desktops) */
```

#### **Mobile-Specific Features**
- **Sticky Form Actions**: Form buttons stick to bottom on mobile for easy access
- **Collapsible Sections**: Content organized in expandable sections for mobile
- **Touch-Optimized Tables**: Responsive tables with horizontal scrolling and touch-friendly controls
- **Mobile Navigation**: Dedicated mobile navigation patterns with gesture support
- **Screen Orientation Support**: Optimized layouts for both portrait and landscape modes

#### **Cross-Platform Compatibility**
- **iOS Safari**: Specific optimizations for iOS Safari quirks and features
- **Android Chrome**: Enhanced support for Android Chrome and WebView
- **PWA Features**: Progressive Web App capabilities for native-like mobile experience
- **Touch Device Detection**: Adaptive UI based on touch capability detection

## Technology Stack

### **Core Technologies**
- **React 18** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server

### **State Management**
- **React Query (TanStack Query)** - Server state management with caching
- **React Context** - Client state management
- **React Hook Form** - Efficient form handling

### **UI & UX**
- **Headless UI** - Accessible UI components
- **Heroicons** - Beautiful SVG icons
- **React Hot Toast** - Elegant notifications
- **date-fns** - Modern date utility library

### **Development Tools**
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Jest** - Unit testing framework
- **React Testing Library** - Component testing

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Interview Position Tracker API running on `http://localhost:8000`

### Installation

1. **Clone the repository and navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your API configuration
```

4. **Start the development server:**
```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_VERSION=v1

# Application Configuration
REACT_APP_APP_NAME=Interview Position Tracker
REACT_APP_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_OFFLINE_MODE=true

# Development
REACT_APP_DEBUG_MODE=false
```

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Basic UI components (Button, Input, Modal, LoadingStates, etc.)
│   │   ├── error/         # Error handling components (ErrorBoundary, ErrorDisplay)
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── positions/     # Position management components
│   │   ├── interviews/    # Interview management components
│   │   └── layout/        # Layout components (Header, Sidebar)
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   │   ├── useFeedback.ts      # Unified feedback and error handling
│   │   ├── useAuth.ts          # Authentication with error handling
│   │   ├── usePositions.ts     # Position management with retry logic
│   │   └── useInterviews.ts    # Interview management with error recovery
│   ├── services/          # API service layer
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   │   ├── errorMessages.ts    # User-friendly error message mapping
│   │   ├── retryMechanism.ts   # Automatic retry logic with backoff
│   │   └── notifications.ts    # Enhanced notification system
│   ├── contexts/          # React contexts
│   ├── constants/         # Application constants
│   └── styles/            # Global styles and Tailwind config
├── .kiro/specs/           # Project specifications
│   ├── requirements.md    # Detailed requirements
│   ├── design.md         # Architecture and design
│   └── tasks.md          # Implementation tasks
└── README.md             # This file
```

## Development

### Available Scripts

```bash
# Development
npm start              # Start development server
npm run dev           # Alternative start command

# Building
npm run build         # Create production build
npm run build:analyze # Build with bundle analysis

# Testing
npm test              # Run tests in watch mode
npm run test:ci       # Run tests once for CI
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format code with Prettier
npm run type-check    # Run TypeScript type checking

# Utilities
npm run clean         # Clean build artifacts
npm run preview       # Preview production build locally
```

### Development Workflow

1. **Start the API server** (see main README)
2. **Start the frontend development server**
3. **Make changes** and see them reflected immediately
4. **Run tests** to ensure functionality
5. **Check code quality** with linting and formatting

### Code Style and Standards

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Airbnb configuration with React hooks rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages

## Advanced Filtering System

The application features a comprehensive filtering system designed to help users efficiently find and organize their job applications.

### 🎯 **Filter Presets**

**Default Presets** (always available):
- **Active Applications**: Shows positions with "applied" status
- **In Progress**: Displays positions currently in "interviewing" status  
- **Recent Applications**: Applications from the last 7 days
- **Needs Follow-up**: Positions in "screening" status

**Custom Presets**:
- Save any filter combination with a custom name
- Usage tracking shows how often each preset is used
- Presets are sorted by popularity for quick access
- Delete custom presets (default presets are protected)
- Share presets via URL generation

### 📅 **Enhanced Date Range Filtering**

**Quick Select Options**:
- Last 7 days, 30 days, 3 months, 6 months
- This year, last year
- Custom date range with calendar picker

**Smart Features**:
- Validation prevents invalid date ranges (start after end)
- Warnings for future dates or very old date ranges
- Visual feedback with clear date range display
- Easy clearing and resetting of date filters

### 🧠 **Intelligent Filter Validation**

**Real-time Validation**:
- Date range order validation
- Search term optimization suggestions
- Filter combination logic checking
- Performance recommendations based on result count

**Smart Suggestions**:
- Suggests broadening criteria when no results found
- Recommends adding filters when too many results
- Provides positive feedback for optimal result sets
- Context-aware tips based on filter combinations

### 💾 **Import/Export System**

**Export Capabilities**:
- Save current filters as JSON files
- Generate shareable URLs with filter parameters
- Create QR codes for mobile sharing
- Export filter preset collections

**Import Features**:
- Load filters from JSON files
- Import filter presets from other users
- URL-based filter sharing and bookmarking
- Validation of imported filter data

### 🔧 **Technical Implementation**

**Components**:
- `FilterBar`: Main filtering interface with all controls
- `FilterPresets`: Preset management and selection
- `DateRangePicker`: Enhanced date range selection
- Filter validation utilities with comprehensive rule engine
- Import/export utilities with JSON and URL handling

**Key Features**:
- Debounced search input for optimal performance
- URL state persistence for bookmarking and sharing
- Local storage for custom presets and preferences
- Optimistic updates with error rollback
- Comprehensive test coverage (44 tests across all filtering features)

## Architecture

### Component Architecture
- **Atomic Design**: Components organized by complexity (atoms, molecules, organisms)
- **Feature-Based**: Components grouped by feature domain
- **Reusable UI Library**: Consistent design system components

### Interview Management Components

The interview management system consists of several specialized components:

#### **Core Components**
- **InterviewCard**: Comprehensive card component with inline editing capabilities
- **InterviewForm**: Full-featured form for creating and editing interviews with validation
- **InterviewList**: List component with advanced filtering, sorting, and empty state handling

#### **Inline Editing Components**
- **InlineDatePicker**: Quick date/time editing with validation and keyboard shortcuts
- **InlineStatusSelector**: Fast status updates with immediate feedback
- **InterviewQuickActions**: Action buttons for common operations (pass/fail, reschedule, cancel)

#### **Enhanced UX Components**
- **InterviewTooltip**: Detailed hover previews with smart positioning
- **InterviewPreview**: Compact preview for position cards with summary stats

#### **Key Features**
- **Draft Auto-save**: Form data automatically saved to prevent data loss
- **Optimistic Updates**: Immediate UI feedback with error rollback
- **Smart Validation**: Context-aware validation (e.g., past date warnings)
- **Keyboard Navigation**: Full keyboard accessibility with shortcuts
- **Visual Feedback**: Color-coded status, overdue indicators, and progress states

### State Management
- **Server State**: React Query for API data with caching and synchronization
- **Client State**: React Context for UI state and user preferences
- **Form State**: React Hook Form for efficient form management

### Caching Strategy
- **Multi-Layer Caching**: React Query + Browser Storage + Service Worker
- **Optimistic Updates**: Immediate UI updates with rollback on error
- **Background Sync**: Automatic data refresh and offline queue
- **Smart Prefetching**: Anticipate user needs with hover-based prefetching

## API Integration

### Authentication Flow
```typescript
// Login
const { mutate: login } = useLogin();
login({ email, password });

// Protected requests
const { data: positions } = usePositions(); // Automatically includes auth headers
```

### Data Fetching
```typescript
// Fetch positions with caching
const { data, isLoading, error } = usePositions({
  status: 'interviewing',
  company: 'TechCorp'
});

// Create position with optimistic updates
const { mutate: createPosition } = useCreatePosition();
createPosition(positionData);

// Fetch interviews for a position
const { data: interviews } = useInterviews(positionId);

// Create interview with optimistic updates
const { mutate: createInterview } = useCreateInterview();
createInterview({
  position_id: positionId,
  type: InterviewType.TECHNICAL,
  place: InterviewPlace.VIDEO,
  scheduled_date: '2024-02-15T14:00:00',
  outcome: InterviewOutcome.PENDING
});

// Quick update interview status
const { mutate: updateStatus } = useUpdateInterviewOutcome();
updateStatus({ id: interviewId, outcome: InterviewOutcome.PASSED });
```

### Error Handling & Recovery
```typescript
// Comprehensive error handling with feedback
const { loading, error, handleAsyncOperation } = useFeedback();

// Form submission with error recovery
const handleSubmit = async (formData) => {
  await handleAsyncOperation(
    () => createPosition(formData),
    {
      loadingMessage: 'Creating position...',
      successMessage: 'Position created successfully!',
      errorMessage: 'Failed to create position. Please try again.',
      showSuccessConfirmation: true,
      onError: (error) => {
        // Handle field-specific errors
        if (error.field_errors) {
          Object.entries(error.field_errors).forEach(([field, message]) => {
            setError(field, { message });
          });
        }
      }
    }
  );
};

// Automatic retry with exponential backoff
const { data, error, retry } = usePositions({
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    backoffFactor: 2,
    retryCondition: (error) => error.response?.status >= 500
  }
});

// Network-aware operations with offline queue
const { mutate: createInterview } = useCreateInterview({
  onError: (error) => {
    if (!navigator.onLine) {
      // Automatically queued for retry when online
      notifications.info('Request queued for when you reconnect');
    } else {
      notifications.error(getErrorMessage(error));
    }
  }
});
```

**Key Features:**
- **Global Error Boundary**: Catches unhandled React errors with fallback UI
- **Feature-Specific Boundaries**: Isolated error handling for different app sections
- **Automatic Retry Logic**: Failed API requests retry with exponential backoff
- **User-Friendly Messages**: Over 20 predefined error types with clear explanations
- **Offline Support**: Failed requests queued and retried when connection returns
- **Recovery Actions**: Context-aware recovery options (retry, refresh, navigate)

## Testing

### 🧪 **Comprehensive Testing Infrastructure**

The application features a robust testing infrastructure designed to ensure code quality, reliability, and maintainability across all components and features.

#### **Testing Framework & Tools**
- **Jest** - Primary testing framework with custom configuration
- **React Testing Library** - Component testing with user-centric approach
- **jest-axe** - Automated accessibility testing
- **MSW (Mock Service Worker)** - API mocking for integration tests
- **User Event** - Realistic user interaction simulation

#### **Test Coverage & Quality**
- **Coverage Thresholds**: 70% minimum across branches, functions, lines, and statements
- **Comprehensive Test Suite**: 100+ tests covering all major functionality
- **CI Integration**: Automated testing on every commit and pull request
- **Quality Gates**: Tests must pass before deployment

### 🏗️ **Testing Architecture**

#### **Test Organization**
```
src/
├── __tests__/                    # Integration tests
│   └── App.integration.test.tsx  # Full app workflow tests
├── components/
│   ├── ui/__tests__/            # UI component tests
│   │   ├── Button.test.tsx      # Button component tests
│   │   ├── Input.test.tsx       # Input component tests
│   │   └── Modal.test.tsx       # Modal component tests
│   ├── auth/__tests__/          # Authentication tests
│   │   └── LoginForm.test.tsx   # Login form integration tests
│   └── positions/__tests__/     # Position management tests
│       └── PositionCard.test.tsx # Position card component tests
├── hooks/__tests__/             # Custom hook tests
│   └── useAuth.test.tsx         # Authentication hook tests
├── services/__tests__/          # API service tests
│   └── authService.test.ts      # Authentication service tests
├── utils/__tests__/             # Utility function tests
│   └── filterValidation.test.ts # Filter validation tests
└── test-utils/                  # Testing utilities
    ├── index.tsx                # Custom render functions
    ├── test-data.ts             # Mock data factories
    ├── accessibility.tsx        # Accessibility testing utilities
    ├── custom-matchers.ts       # Custom Jest matchers
    └── mocks/                   # API mocks
        ├── handlers.ts          # MSW request handlers
        └── server.ts            # MSW server setup
```

#### **Custom Testing Utilities**

**Enhanced Render Functions**:
```typescript
// Render with all providers
renderWithProviders(<Component />, {
  initialUser: mockUser,
  queryClient: testQueryClient
});

// Render with authentication
renderWithAuth(<ProtectedComponent />);

// Render without authentication
renderWithoutAuth(<PublicComponent />);
```

**Mock Data Factories**:
```typescript
// Create realistic test data
const mockUser = createMockUser({ email: 'test@example.com' });
const mockPosition = createMockPosition({ status: PositionStatus.APPLIED });
const mockInterview = createMockInterview({ type: InterviewType.TECHNICAL });
```

**Custom Jest Matchers**:
```typescript
// Domain-specific assertions
expect(button).toHaveLoadingState();
expect(form).toBeValidForm();
expect(element).toBeAccessible();
expect(component).toHaveErrorState();
```

### 🎯 **Test Categories**

#### **Unit Tests**
- **Component Logic**: Individual component behavior and rendering
- **Utility Functions**: Pure function testing with edge cases
- **Custom Hooks**: Hook behavior with various states and scenarios
- **Service Functions**: API service methods with mock responses

#### **Integration Tests**
- **User Workflows**: Complete user journeys from login to task completion
- **Component Interactions**: Multi-component scenarios and data flow
- **API Integration**: End-to-end API communication with realistic scenarios
- **Error Handling**: Error boundary and recovery mechanism testing

#### **Accessibility Tests**
- **WCAG 2.1 AA Compliance**: Automated accessibility rule checking
- **Keyboard Navigation**: Tab order and keyboard interaction testing
- **Screen Reader Support**: ARIA attributes and semantic HTML validation
- **Focus Management**: Focus trap and restoration testing

#### **User Interaction Tests**
- **Click Events**: Button clicks, form submissions, and navigation
- **Keyboard Events**: Enter, Escape, Tab, and arrow key handling
- **Touch Events**: Mobile touch interactions and gesture support
- **Form Interactions**: Input validation, error handling, and submission

### 🚀 **Running Tests**

#### **Development Testing**
```bash
# Run all tests in watch mode
npm test

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="authentication"

# Debug tests with Node inspector
npm run test:debug
```

#### **CI/CD Testing**
```bash
# Run tests once for CI
npm run test:ci

# Run tests with coverage for CI
npm run test:coverage

# Run tests with verbose output
npm test -- --verbose
```

#### **Test Configuration**
```javascript
// jest.config.js
module.exports = {
  preset: 'react-scripts',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-utils/**',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### 📊 **Test Examples**

#### **Component Testing**
```typescript
describe('Button Component', () => {
  it('renders with different variants', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('passes accessibility tests', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### **Integration Testing**
```typescript
describe('Authentication Flow', () => {
  it('handles complete login workflow', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    // Fill login form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify dashboard loads
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});
```

#### **API Service Testing**
```typescript
describe('AuthService', () => {
  it('handles login success', async () => {
    const mockResponse = {
      data: { access_token: 'token', user: mockUser }
    };
    mockedHttpClient.post.mockResolvedValue(mockResponse);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(result).toEqual(mockResponse.data);
    expect(localStorage.getItem('access_token')).toBe('token');
  });
});
```

#### **Accessibility Testing**
```typescript
describe('Accessibility', () => {
  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<NavigationComponent />);

    // Test tab navigation
    await user.tab();
    expect(screen.getByRole('button', { name: /first/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /second/i })).toHaveFocus();
  });

  it('has proper ARIA attributes', () => {
    render(<Modal isOpen title="Test Modal">Content</Modal>);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby');
  });
});
```

### 🔧 **Testing Best Practices**

#### **Test Writing Guidelines**
- **User-Centric Testing**: Test behavior, not implementation details
- **Descriptive Test Names**: Clear, specific test descriptions
- **Arrange-Act-Assert**: Consistent test structure
- **Mock External Dependencies**: Isolate units under test
- **Test Edge Cases**: Error conditions and boundary values

#### **Accessibility Testing Standards**
- **Automated Testing**: jest-axe for WCAG compliance
- **Manual Testing**: Screen reader and keyboard testing
- **Color Contrast**: Verify sufficient contrast ratios
- **Focus Management**: Test focus indicators and trapping

#### **Performance Testing**
- **Render Performance**: Measure component render times
- **Memory Leaks**: Test for proper cleanup
- **Bundle Size**: Monitor test bundle impact
- **Async Operations**: Test loading states and error handling

### 📈 **Test Metrics & Monitoring**

#### **Coverage Reports**
```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

#### **Test Performance**
- **Test Execution Time**: Monitor slow tests
- **Flaky Test Detection**: Identify unreliable tests
- **Coverage Trends**: Track coverage over time
- **Test Maintenance**: Regular test review and updates

#### **Quality Metrics**
- **Test-to-Code Ratio**: Maintain healthy test coverage
- **Bug Detection Rate**: Tests catching real issues
- **Regression Prevention**: Tests preventing feature breaks
- **Documentation Value**: Tests as living documentation

## Production Build & Optimization

### 🚀 **Advanced Build System**

The application features a comprehensive production build optimization system designed for maximum performance, reliability, and maintainability.

#### **Build Optimization Features**
- **CRACO Configuration**: Custom webpack configuration with advanced optimization
- **Code Splitting**: Intelligent chunk splitting for vendors, React, charts, and common code
- **Tree Shaking**: Automatic dead code elimination with `usedExports` and `sideEffects: false`
- **Bundle Optimization**: Optimized chunk strategy with automatic code splitting
- **Compression**: Gzip compression for all assets with configurable thresholds

#### **Service Worker & Caching**
- **Workbox Integration**: Automatic service worker generation with runtime caching
- **Smart Caching Strategies**: 
  - Cache-first for fonts and images (365-day expiration)
  - Stale-while-revalidate for static resources
  - Network-first for API calls (5-minute expiration)
- **Offline Support**: Graceful degradation and cache management
- **Update Management**: Automatic updates with user notifications

#### **Environment-Specific Configuration**
- **Environment Files**: Separate configs for development, staging, and production
- **Type-Safe Configuration**: Comprehensive environment management system
- **Feature Flags**: Environment-based feature toggles
- **API Configuration**: Environment-specific API settings and timeouts

#### **Build Analysis & Monitoring**
- **Bundle Analyzer**: Webpack bundle analyzer integration
- **Size Monitoring**: Automated bundle size checks with limits
- **Performance Budgets**: Enforced size limits (500kB JS, 50kB CSS, 600kB total)
- **Optimization Scripts**: Comprehensive build optimization automation

### 📊 **Build Commands**

#### **Development**
```bash
npm start              # Start development server with CRACO
npm run start:wsl      # Start with WSL configuration
```

#### **Production Builds**
```bash
npm run build                    # Standard production build
npm run build:production         # Production build without source maps
npm run build:staging           # Staging environment build
npm run build:analyze           # Build with bundle analysis
```

#### **Analysis and Optimization**
```bash
npm run analyze                  # Basic bundle analysis
npm run analyze:detailed         # Detailed webpack analysis
npm run bundle-size             # Check bundle size limits
npm run optimize                # Run all optimization steps
npm run optimize:analyze        # Analyze bundle composition
npm run optimize:check-size     # Check size against limits
npm run optimize:clean         # Clean build directory
```

#### **Preview**
```bash
npm run preview                 # Preview standard build
npm run preview:production      # Preview production build
```

### 🔧 **Build Configuration**

#### **CRACO Configuration (`craco.config.js`)**
- Custom webpack configuration for enhanced optimization
- Automatic code splitting with vendor, common, and feature-specific chunks
- Tree shaking enabled for unused code elimination
- Optimized chunk splitting strategy

#### **Environment Configuration**
```bash
# Development
.env.development     # Debug mode, source maps, dev tools

# Staging  
.env.staging         # Production-like optimizations, performance monitoring

# Production
.env.production      # Maximum optimization, no source maps, error logging only
```

#### **Bundle Size Limits**
- **JavaScript Bundle**: 500 kB (gzipped)
- **CSS Bundle**: 50 kB (gzipped)  
- **Total Bundle Size**: 600 kB (gzipped)

### ⚡ **Performance Optimizations**

#### **Production Optimizations**
- **Minification**: Terser plugin with aggressive optimization
- **Compression**: Gzip compression for all assets
- **Console Removal**: Automatic console.log removal
- **Source Maps**: Disabled in production for security
- **Dead Code Elimination**: Unused code removal

#### **Development Optimizations**
- **Source Maps**: Enabled for debugging
- **Hot Reload**: Fast refresh for development
- **Vendor Splitting**: Separate vendor chunks for faster rebuilds

### 📈 **Performance Monitoring**

#### **Core Web Vitals**
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)  
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **TTFB** (Time to First Byte)

#### **Custom Metrics**
- Page load time
- DOM content loaded time
- Resource timing
- User timing
- Long task monitoring

### 🛠️ **Build Tools & Scripts**

#### **Optimization Script (`scripts/build-optimize.sh`)**
- Comprehensive build optimization automation
- Bundle size analysis and reporting
- Performance monitoring and reporting
- Environment-specific build management

#### **Bundle Analysis Tools**
- Webpack Bundle Analyzer integration
- Bundle size monitoring with bundlesize
- Performance budget enforcement
- Dependency analysis and optimization recommendations

## Performance

### Optimization Features
- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Images and non-critical components
- **Memoization**: Prevent unnecessary re-renders
- **Virtual Scrolling**: Handle large lists efficiently

### Bundle Analysis
```bash
npm run build:analyze
```

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Cache Hit Rates**: Monitor caching effectiveness
- **Bundle Size**: Track and optimize bundle size

## Accessibility

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Focus Management**: Visible focus indicators

### Accessibility Testing
```bash
# Run accessibility tests
npm run test:a11y

# Manual testing with screen reader
# Use NVDA, JAWS, or VoiceOver for testing
```

## Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
# Build Docker image
docker build -t interview-tracker-frontend .

# Run container
docker run -p 3000:80 interview-tracker-frontend
```

### Environment-Specific Builds
```bash
# Staging build
REACT_APP_API_BASE_URL=https://api-staging.example.com npm run build

# Production build
REACT_APP_API_BASE_URL=https://api.example.com npm run build
```

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Standards
- Follow TypeScript strict mode
- Write tests for new features
- Maintain accessibility standards
- Update documentation as needed

### Commit Convention
```
feat: add position filtering functionality
fix: resolve authentication token refresh issue
docs: update API integration guide
test: add unit tests for InterviewCard component
```

## Troubleshooting

### Common Issues

**API Connection Issues:**
```bash
# Check if API is running
curl http://localhost:8000/health

# Verify CORS configuration in API
# Check browser network tab for CORS errors
```

**Build Issues:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run clean
```

**Authentication Issues:**
```bash
# Check token storage in browser DevTools
# Verify API authentication endpoints
# Check network requests for 401/403 errors
```

**Error Handling Issues:**
```bash
# Check error boundary functionality
# Verify error messages are user-friendly
# Test retry mechanisms with network throttling
# Check offline queue in browser DevTools Application tab
```

**Notification Issues:**
```bash
# Verify toast notifications appear and dismiss correctly
# Check notification positioning and z-index conflicts
# Test notification actions and callbacks
# Verify accessibility with screen readers
```

### Debug Mode
Enable debug mode in `.env.local`:
```env
REACT_APP_DEBUG_MODE=true
```

## Roadmap

### Upcoming Features
- [x] **Interview Management System** - Comprehensive interview tracking with inline editing
- [x] **Quick Actions** - Fast operations for common interview tasks
- [x] **Smart Visual Indicators** - Color-coded status and overdue warnings
- [x] **Statistics & Analytics Dashboard** - Interactive charts with drill-down capabilities and export features
- [x] **Error Handling & User Feedback** - Comprehensive error boundaries, retry mechanisms, and user notifications
- [ ] Real-time notifications for upcoming interviews
- [ ] Interview calendar integration (Google Calendar, Outlook)
- [ ] Interview preparation checklist and notes
- [ ] Document upload and management
- [ ] Team collaboration features
- [ ] Mobile app (React Native)

### Performance Improvements
- [ ] Service Worker implementation
- [ ] Advanced caching strategies
- [ ] Image optimization
- [ ] Bundle size optimization

## Support

For questions, issues, or contributions:

1. **Check the documentation** in `.kiro/specs/`
2. **Search existing issues** in the repository
3. **Create a new issue** with detailed information
4. **Join discussions** in the project repository

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using React, TypeScript, and modern web technologies.**