# Interview Position Tracker API

A REST API backend for tracking job positions and interview progress, built with FastAPI and PostgreSQL.

## Setup

### Prerequisites
- Python 3.9+
- PostgreSQL database (local or cloud)

### Installation

1. Clone the repository and navigate to the project directory

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and configuration
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

### Authentication

All API endpoints (except health check) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### Authentication Endpoints
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get JWT token

#### Position Management Endpoints
- `POST /api/v1/positions/` - Create a new job position
- `GET /api/v1/positions/` - List all positions with filtering and pagination
- `GET /api/v1/positions/{id}` - Get a specific position
- `PUT /api/v1/positions/{id}` - Update a position
- `PUT /api/v1/positions/{id}/status` - Update only the position status
- `DELETE /api/v1/positions/{id}` - Delete a position

#### Interview Management Endpoints
- `POST /api/v1/positions/{position_id}/interviews` - Create a new interview for a position
- `GET /api/v1/positions/{position_id}/interviews` - List all interviews for a position
- `GET /api/v1/interviews/{id}` - Get a specific interview
- `PUT /api/v1/interviews/{id}` - Update an interview (all fields)
- `PUT /api/v1/interviews/{id}/schedule` - Update only the interview scheduled date
- `PUT /api/v1/interviews/{id}/notes` - Update only the interview notes
- `PUT /api/v1/interviews/{id}/outcome` - Update only the interview outcome
- `DELETE /api/v1/interviews/{id}` - Delete an interview

#### Statistics & Analytics Endpoints
- `GET /api/v1/statistics/overview` - Get overview statistics with conversion rates and breakdowns
- `GET /api/v1/statistics/timeline` - Get timeline-based statistics with monthly trends
- `GET /api/v1/statistics/companies` - Get company-based statistics and success rates

#### Position Status Values
The following status values are supported:
- `applied` - Application submitted
- `screening` - Initial screening phase
- `interviewing` - Interview process ongoing
- `offer` - Job offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn

#### Interview Types
- `technical` - Technical interview
- `behavioral` - Behavioral interview
- `hr` - HR screening interview
- `final` - Final interview

#### Interview Places/Formats
- `phone` - Phone interview
- `video` - Video call interview
- `onsite` - In-person interview

#### Interview Outcomes
- `pending` - Interview not yet completed
- `passed` - Interview passed successfully
- `failed` - Interview failed
- `cancelled` - Interview was cancelled

**Note**: When an interview outcome is set to `failed`, the associated position status is automatically updated to `rejected`.

#### Position Filtering & Pagination
The list positions endpoint supports comprehensive filtering and pagination:

**Filtering Parameters:**
- `status` - Filter by position status (applied, interviewing, rejected, etc.)
- `company` - Filter by company name (partial match, case-insensitive)
- `date_from` - Filter positions from this application date (YYYY-MM-DD)
- `date_to` - Filter positions up to this application date (YYYY-MM-DD)
- `search` - Full-text search across title, company, and description fields

**Sorting Parameters:**
- `sort_by` - Field to sort by: application_date, title, company (default: application_date)
- `sort_order` - Sort order: asc or desc (default: desc)

**Pagination Parameters:**
- `page` - Page number (1-based, default: 1)
- `per_page` - Number of items per page (1-100, default: 20)

**Response Format:**
```json
{
  "positions": [...],
  "total": 25,
  "page": 1,
  "per_page": 20,
  "has_next": true,
  "has_prev": false
}
```

#### Example API Usage

**Create a position:**
```bash
curl -X POST "http://localhost:8000/api/v1/positions/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "description": "Full-stack development role",
    "location": "San Francisco, CA",
    "salary_range": "$120k - $150k",
    "status": "applied",
    "application_date": "2024-01-15"
  }'
```

**Update position status:**
```bash
curl -X PUT "http://localhost:8000/api/v1/positions/{position_id}/status" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "interviewing"}'
```

**List positions with filtering and pagination:**
```bash
# Filter by status and company with pagination
curl "http://localhost:8000/api/v1/positions/?status=interviewing&company=Tech&page=1&per_page=10" \
  -H "Authorization: Bearer <token>"

# Search with date range filtering
curl "http://localhost:8000/api/v1/positions/?search=Python&date_from=2024-01-01&date_to=2024-12-31&sort_by=title&sort_order=asc" \
  -H "Authorization: Bearer <token>"

# Combined filters
curl "http://localhost:8000/api/v1/positions/?status=applied&company=startup&search=engineer&page=2&per_page=5" \
  -H "Authorization: Bearer <token>"
```

**Create an interview for a position:**
```bash
curl -X POST "http://localhost:8000/api/v1/positions/{position_id}/interviews" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "technical",
    "place": "video",
    "scheduled_date": "2024-02-15T14:00:00",
    "duration_minutes": 60,
    "notes": "Technical interview with the engineering team",
    "outcome": "pending"
  }'
```

**Update interview scheduled date:**
```bash
curl -X PUT "http://localhost:8000/api/v1/interviews/{interview_id}/schedule" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"scheduled_date": "2024-02-16T15:00:00"}'
```

**Update interview notes:**
```bash
curl -X PUT "http://localhost:8000/api/v1/interviews/{interview_id}/notes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Great discussion about system architecture and scalability"}'
```

**Update interview outcome (with automatic position status update):**
```bash
curl -X PUT "http://localhost:8000/api/v1/interviews/{interview_id}/outcome" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"outcome": "passed"}'
```

**List interviews for a position:**
```bash
curl "http://localhost:8000/api/v1/positions/{position_id}/interviews" \
  -H "Authorization: Bearer <token>"
```

### Statistics & Analytics

The API provides comprehensive statistics and analytics endpoints to help track your job search progress and identify trends.

#### Statistics Filtering
All statistics endpoints support optional query parameters for filtering:
- `start_date` - Filter data from this date (YYYY-MM-DD)
- `end_date` - Filter data up to this date (YYYY-MM-DD)
- `company` - Filter by company name (partial match)
- `status` - Filter by position status

#### Overview Statistics
Get comprehensive metrics about your job applications:

```bash
curl "http://localhost:8000/api/v1/statistics/overview" \
  -H "Authorization: Bearer <token>"
```

**Response includes:**
- Total applications, companies, and interviews
- Response rate (% of applications that got responses)
- Interview rate (% of applications that led to interviews)
- Offer rate (% of applications that led to offers)
- Breakdowns by position status, interview type, and interview outcome

**Example response:**
```json
{
  "total_applications": 25,
  "total_companies": 18,
  "total_interviews": 12,
  "response_rate": 68.0,
  "interview_rate": 48.0,
  "offer_rate": 12.0,
  "status_breakdown": {
    "applied": 8,
    "screening": 3,
    "interviewing": 6,
    "offer": 3,
    "rejected": 4,
    "withdrawn": 1
  },
  "interview_type_breakdown": {
    "technical": 8,
    "behavioral": 6,
    "hr": 4,
    "final": 2
  },
  "interview_outcome_breakdown": {
    "pending": 3,
    "passed": 7,
    "failed": 2,
    "cancelled": 0
  }
}
```

#### Timeline Statistics
Get time-based analytics to track trends over time:

```bash
curl "http://localhost:8000/api/v1/statistics/timeline?start_date=2024-01-01&end_date=2024-12-31" \
  -H "Authorization: Bearer <token>"
```

**Response includes:**
- Applications and interviews per month
- Average response time from application to first interview
- Average time from interview to final decision

**Example response:**
```json
{
  "period_start": "2024-01-01",
  "period_end": "2024-12-31",
  "applications_per_month": [
    {"month": "2024-01", "count": 8},
    {"month": "2024-02", "count": 12},
    {"month": "2024-03", "count": 5}
  ],
  "interviews_per_month": [
    {"month": "2024-01", "count": 3},
    {"month": "2024-02", "count": 7},
    {"month": "2024-03", "count": 2}
  ],
  "average_response_time_days": 12.5,
  "average_interview_to_decision_days": 8.2
}
```

#### Company Statistics
Get detailed statistics broken down by company:

```bash
curl "http://localhost:8000/api/v1/statistics/companies" \
  -H "Authorization: Bearer <token>"
```

**Response includes:**
- Statistics for each company you've applied to
- Success rates and application counts per company
- Companies sorted by total applications (descending)

**Example response:**
```json
{
  "companies": [
    {
      "company_name": "TechCorp",
      "total_applications": 3,
      "total_interviews": 2,
      "latest_application_date": "2024-02-15",
      "status_breakdown": {
        "applied": 1,
        "interviewing": 1,
        "offer": 1,
        "rejected": 0,
        "screening": 0,
        "withdrawn": 0
      },
      "success_rate": 33.33
    },
    {
      "company_name": "StartupInc",
      "total_applications": 2,
      "total_interviews": 1,
      "latest_application_date": "2024-02-10",
      "status_breakdown": {
        "applied": 1,
        "rejected": 1,
        "interviewing": 0,
        "offer": 0,
        "screening": 0,
        "withdrawn": 0
      },
      "success_rate": 0.0
    }
  ],
  "total_companies": 2
}
```

#### Statistics with Filters
Apply filters to focus on specific time periods or companies:

```bash
# Get statistics for a specific time period
curl "http://localhost:8000/api/v1/statistics/overview?start_date=2024-01-01&end_date=2024-03-31" \
  -H "Authorization: Bearer <token>"

# Get statistics for specific companies
curl "http://localhost:8000/api/v1/statistics/companies?company=Tech" \
  -H "Authorization: Bearer <token>"

# Get timeline statistics for specific status
curl "http://localhost:8000/api/v1/statistics/timeline?status=interviewing" \
  -H "Authorization: Bearer <token>"
```

## Features

### Interview Stage Tracking
- **Complete CRUD Operations**: Create, read, update, and delete interviews for each position
- **Granular Updates**: Dedicated endpoints for updating specific fields (schedule, notes, outcome)
- **Automatic Status Management**: Failed interviews automatically update position status to "rejected"
- **Cascade Deletion**: Deleting a position removes all associated interviews
- **Comprehensive Validation**: Input validation for dates, durations, and enum values
- **Security**: All operations require authentication and verify user ownership

### Position Management
- **Filtering & Search**: Filter positions by status, company, date range, or search terms
- **Pagination**: Efficient pagination with configurable page sizes
- **Status Tracking**: Track application progress through various stages
- **Relationship Management**: Positions include associated interview data

### Statistics & Analytics
- **Overview Metrics**: Track total applications, response rates, interview rates, and offer rates
- **Conversion Analysis**: Calculate success rates and conversion funnels
- **Timeline Trends**: Monitor application and interview activity over time with monthly breakdowns
- **Company Insights**: Analyze performance and success rates by company
- **Flexible Filtering**: Apply date range, company, and status filters to all statistics
- **Performance Tracking**: Average response times and decision timelines

## Testing

Run tests with:
```bash
pytest
```

## Project Structure

```
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── api/                 # API route handlers
│   ├── core/                # Core configuration and utilities
│   ├── models/              # SQLAlchemy database models
│   ├── repositories/        # Data access layer
│   ├── schemas/             # Pydantic models for validation
│   └── services/            # Business logic layer
├── alembic/                 # Database migration files
├── tests/                   # Test files
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```