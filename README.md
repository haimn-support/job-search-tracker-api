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

#### Position Status Values
The following status values are supported:
- `applied` - Application submitted
- `screening` - Initial screening phase
- `interviewing` - Interview process ongoing
- `offer` - Job offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn

#### Position Filtering
The list positions endpoint supports the following query parameters:
- `status` - Filter by position status
- `company` - Filter by company name (partial match)
- `date_from` - Filter positions from this application date
- `date_to` - Filter positions up to this application date
- `search` - Search in title, company, or description
- `sort_by` - Field to sort by (default: application_date)
- `sort_order` - Sort order: asc or desc (default: desc)
- `page` - Page number (1-based, default: 1)
- `per_page` - Number of items per page (default: 20, max: 100)

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

**List positions with filtering:**
```bash
curl "http://localhost:8000/api/v1/positions/?status=interviewing&company=Tech&page=1&per_page=10" \
  -H "Authorization: Bearer <token>"
```

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