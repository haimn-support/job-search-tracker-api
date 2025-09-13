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