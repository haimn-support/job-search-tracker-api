# Job Search Tracker API

A comprehensive REST API backend for tracking job positions and interview progress, built with FastAPI and PostgreSQL. This is the backend service that powers the Job Search Tracker application.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL database (local or cloud)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/haim9798/job-search-tracker-api.git
cd job-search-tracker-api
```

2. **Create a virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials and configuration
```

5. **Run database migrations:**
```bash
alembic upgrade head
```

6. **Start the development server:**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

Once the server is running, you can access:
- **Interactive API docs**: `http://localhost:8000/docs`
- **ReDoc documentation**: `http://localhost:8000/redoc`
- **OpenAPI schema**: `http://localhost:8000/openapi.json`

## 🔗 Related Projects

- **[Job Search Tracker Frontend](https://github.com/haim9798/job-search-tracker-frontend)** - React TypeScript frontend application
- **[Job Search Tracker Documentation](https://github.com/haim9798/job-search-tracker-api/tree/main/docs)** - Complete documentation

## 🏗️ Architecture

This API is built with a modern, scalable architecture:

- **FastAPI** - Modern, fast web framework for building APIs
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Alembic** - Database migration tool
- **Pydantic** - Data validation using Python type annotations
- **JWT Authentication** - Secure token-based authentication
- **Docker** - Containerized deployment support
- **Kubernetes** - Production deployment manifests included

## 🚀 Features

### 🔐 **Authentication & Security**
- JWT token-based authentication
- Secure password hashing with bcrypt
- Protected routes and middleware
- Token refresh mechanism
- CORS configuration for frontend integration

### 📋 **Position Management**
- CRUD operations for job positions
- Status tracking (applied, interviewing, offered, rejected)
- Company and position details management
- Application date tracking
- User-specific data isolation

### 🎯 **Interview Management**
- Comprehensive interview tracking
- Multiple interview types (HR, Technical, Behavioral, Final)
- Interview formats (phone, video, on-site)
- Outcome tracking (pending, passed, failed, cancelled)
- Date/time scheduling with validation
- Position-interview relationships

### 📊 **Statistics & Analytics**
- Application success rates
- Interview conversion metrics
- Company performance analytics
- Time-based statistics
- Export capabilities for data analysis

### 🛡️ **Error Handling & Validation**
- Comprehensive input validation
- Detailed error messages
- Database constraint handling
- API rate limiting
- Health check endpoints

## 🐳 Docker Deployment

### Build and Run with Docker

1. **Build the Docker image:**
```bash
docker build -t job-search-tracker-api .
```

2. **Run with Docker Compose:**
```bash
docker-compose up -d
```

3. **Run standalone container:**
```bash
docker run -p 8000:8000 job-search-tracker-api
```

### Docker Hub

The API is available on Docker Hub:
```bash
docker pull haim9798/job-search-tracker-api:latest
```

## ☸️ Kubernetes Deployment

The repository includes comprehensive Kubernetes manifests for production deployment:

- **Namespace**: `interview-tracker`
- **PostgreSQL**: Database with persistent storage
- **API Service**: FastAPI application with health checks
- **ConfigMaps**: Environment configuration
- **Secrets**: Secure credential management
- **PersistentVolumes**: Data persistence

### Deploy to Minikube

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n interview-tracker

# Access the API
kubectl port-forward -n interview-tracker service/api 8000:8000
```

## 🔧 Development

### Available Scripts

```bash
# Development server
uvicorn app.main:app --reload

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "Description"

# Run tests
pytest

# Code formatting
black .
isort .

# Type checking
mypy app/
```

### Environment Variables

Key environment variables for configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Logging
LOG_LEVEL=INFO
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

### Test Coverage
- Unit tests for all API endpoints
- Integration tests for database operations
- Authentication and authorization tests
- Error handling and validation tests

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/me` - Get current user

### Positions
- `GET /api/v1/positions/` - List positions
- `POST /api/v1/positions/` - Create position
- `GET /api/v1/positions/{id}` - Get position details
- `PUT /api/v1/positions/{id}` - Update position
- `DELETE /api/v1/positions/{id}` - Delete position

### Interviews
- `GET /api/v1/interviews/` - List interviews
- `POST /api/v1/interviews/` - Create interview
- `GET /api/v1/interviews/{id}` - Get interview details
- `PUT /api/v1/interviews/{id}` - Update interview
- `DELETE /api/v1/interviews/{id}` - Delete interview

### Statistics
- `GET /api/v1/statistics/overview` - Get statistics overview
- `GET /api/v1/statistics/positions` - Position statistics
- `GET /api/v1/statistics/interviews` - Interview statistics

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Pydantic models for request validation
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection
- **Rate Limiting**: API rate limiting for abuse prevention

## 📈 Performance

- **Async Support**: FastAPI's async capabilities for high performance
- **Database Optimization**: Efficient queries with SQLAlchemy
- **Connection Pooling**: Database connection pooling for scalability
- **Caching**: Optional Redis caching for improved performance
- **Health Checks**: Comprehensive health monitoring

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Standards
- Follow PEP 8 style guidelines
- Use type hints throughout
- Write tests for new features
- Update documentation as needed

### Commit Convention
```
feat: add new API endpoint for bulk operations
fix: resolve database connection timeout issue
docs: update API documentation
test: add integration tests for authentication
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U username -d dbname
```

**Migration Issues:**
```bash
# Check migration status
alembic current

# Reset migrations (development only)
alembic downgrade base
alembic upgrade head
```

**Docker Issues:**
```bash
# Check container logs
docker logs job-search-tracker-api

# Restart containers
docker-compose restart
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Frontend Repository**: [job-search-tracker-frontend](https://github.com/haim9798/job-search-tracker-frontend)
- **Docker Hub**: [haim9798/job-search-tracker-api](https://hub.docker.com/r/haim9798/job-search-tracker-api)
- **API Documentation**: Available at `/docs` when running locally

---

**Built with ❤️ using FastAPI, PostgreSQL, and modern Python technologies.**
