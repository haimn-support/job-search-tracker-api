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

### 📊 **Analytics & Insights**
- Comprehensive statistics dashboard
- Position status breakdown and success rates
- Company-wise application analytics
- Interview outcome tracking and trends

### 🔍 **Search & Filtering**
- Advanced filtering by status, company, and date range
- Full-text search across positions and companies
- Saved filter presets for quick access
- Real-time filter results and counts

### 📱 **Responsive Design**
- Mobile-first responsive design
- Touch-optimized interactions
- Progressive Web App capabilities
- Offline support with data synchronization

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
│   │   ├── ui/            # Basic UI components (Button, Input, Modal)
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── positions/     # Position management components
│   │   ├── interviews/    # Interview management components
│   │   └── layout/        # Layout components (Header, Sidebar)
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
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

### Error Handling
- **Global Error Boundary**: Catches unhandled errors
- **API Error Handling**: Standardized error responses
- **User-Friendly Messages**: Clear error communication
- **Retry Mechanisms**: Automatic retry for network failures

## Testing

### Testing Strategy
- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: Component interactions and API integration
- **Accessibility Tests**: Screen reader and keyboard navigation
- **Visual Regression Tests**: UI consistency across changes

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- PositionCard.test.tsx

# Run tests in CI mode
npm run test:ci
```

### Test Examples
```typescript
// Component testing
test('renders position card with correct information', () => {
  render(<PositionCard position={mockPosition} />);
  expect(screen.getByText('Software Engineer')).toBeInTheDocument();
});

// Interview component testing
test('renders interview card with inline editing', () => {
  render(<InterviewCard interview={mockInterview} onEdit={jest.fn()} />);
  expect(screen.getByText('Technical Interview')).toBeInTheDocument();
  
  // Test inline editing
  fireEvent.click(screen.getByText('Pending'));
  expect(screen.getByRole('combobox')).toBeInTheDocument();
});

// Hook testing
test('usePositions returns cached data', async () => {
  const { result } = renderHook(() => usePositions());
  await waitFor(() => expect(result.current.data).toBeDefined());
});

// Interview hook testing
test('useUpdateInterviewOutcome updates status optimistically', async () => {
  const { result } = renderHook(() => useUpdateInterviewOutcome());
  
  act(() => {
    result.current.mutate({ id: 'interview-id', outcome: 'passed' });
  });
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

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
- [ ] Real-time notifications for upcoming interviews
- [ ] Advanced analytics dashboard with interview success rates
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