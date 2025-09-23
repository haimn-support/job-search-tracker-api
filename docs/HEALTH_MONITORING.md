# Health Checks and Monitoring Configuration

## Overview
This document outlines the health check and monitoring strategy for the Interview Position Tracker application across different environments.

## Health Check Endpoints

### API Health Checks
The API provides several health check endpoints:

#### Basic Health Check
- **Endpoint**: `GET /health`
- **Purpose**: Basic application health status
- **Response**: 
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "environment": "production"
  }
  ```

#### Detailed Health Check
- **Endpoint**: `GET /health/detailed`
- **Purpose**: Comprehensive health status including dependencies
- **Response**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "environment": "production",
    "dependencies": {
      "database": {
        "status": "healthy",
        "response_time_ms": 15,
        "last_check": "2024-01-01T00:00:00Z"
      },
      "redis": {
        "status": "healthy",
        "response_time_ms": 5,
        "last_check": "2024-01-01T00:00:00Z"
      }
    },
    "metrics": {
      "uptime_seconds": 86400,
      "memory_usage_mb": 128,
      "cpu_usage_percent": 15.5
    }
  }
  ```

#### Readiness Check
- **Endpoint**: `GET /health/ready`
- **Purpose**: Check if application is ready to serve traffic
- **Response**:
  ```json
  {
    "status": "ready",
    "timestamp": "2024-01-01T00:00:00Z",
    "checks": {
      "database": "ready",
      "redis": "ready",
      "migrations": "complete"
    }
  }
  ```

#### Liveness Check
- **Endpoint**: `GET /health/live`
- **Purpose**: Check if application is alive and responsive
- **Response**:
  ```json
  {
    "status": "alive",
    "timestamp": "2024-01-01T00:00:00Z",
    "uptime_seconds": 86400
  }
  ```

### Frontend Health Checks
The frontend provides health check endpoints:

#### Basic Health Check
- **Endpoint**: `GET /health`
- **Purpose**: Basic frontend health status
- **Response**: `200 OK` with "healthy" text

#### Service Worker Check
- **Endpoint**: `GET /sw.js`
- **Purpose**: Check service worker availability
- **Response**: Service worker JavaScript file

## Docker Health Checks

### API Container Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

### Frontend Container Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
```

### Database Container Health Check
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d interview_tracker"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Redis Container Health Check
```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

## Kubernetes Health Checks

### API Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: interview-tracker-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: interview-tracker-api:latest
        ports:
        - containerPort: 8000
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 12
```

### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: interview-tracker-frontend
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: interview-tracker-frontend:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

## Monitoring Configuration

### Prometheus Metrics
The API exposes Prometheus metrics at `/metrics`:

```python
# Example metrics
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Request metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

# Application metrics
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')
DATABASE_CONNECTIONS = Gauge('database_connections', 'Number of database connections')
CACHE_HIT_RATIO = Gauge('cache_hit_ratio', 'Cache hit ratio')

# Business metrics
POSITIONS_CREATED = Counter('positions_created_total', 'Total positions created')
INTERVIEWS_SCHEDULED = Counter('interviews_scheduled_total', 'Total interviews scheduled')
USERS_REGISTERED = Counter('users_registered_total', 'Total users registered')
```

### Grafana Dashboard
Create a comprehensive Grafana dashboard with:

#### System Metrics
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Container metrics

#### Application Metrics
- Request rate
- Response time
- Error rate
- Database connections
- Cache performance

#### Business Metrics
- User registrations
- Positions created
- Interviews scheduled
- Active users
- Feature usage

### Alerting Rules

#### Critical Alerts
```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors per second"

# High response time
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High response time detected"
    description: "95th percentile response time is {{ $value }} seconds"

# Database connection issues
- alert: DatabaseConnectionIssues
  expr: database_connections < 1
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Database connection issues"
    description: "No active database connections"

# High memory usage
- alert: HighMemoryUsage
  expr: (memory_usage_bytes / memory_limit_bytes) > 0.9
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage"
    description: "Memory usage is {{ $value }}% of limit"
```

#### Warning Alerts
```yaml
# Low disk space
- alert: LowDiskSpace
  expr: (disk_free_bytes / disk_total_bytes) < 0.1
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Low disk space"
    description: "Disk space is {{ $value }}% free"

# High CPU usage
- alert: HighCPUUsage
  expr: cpu_usage_percent > 80
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage"
    description: "CPU usage is {{ $value }}%"
```

## Logging Configuration

### Structured Logging
```python
import structlog
import logging

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()
```

### Log Levels by Environment
- **Development**: DEBUG
- **Staging**: INFO
- **Production**: WARNING

### Log Aggregation
- Use ELK Stack (Elasticsearch, Logstash, Kibana)
- Or use cloud logging services (AWS CloudWatch, Google Cloud Logging)
- Implement log rotation and retention policies

## Performance Monitoring

### Application Performance Monitoring (APM)
- Use tools like New Relic, Datadog, or Sentry
- Monitor:
  - Response times
  - Database query performance
  - External API calls
  - Error rates and exceptions
  - User experience metrics

### Real User Monitoring (RUM)
- Monitor actual user experience
- Track Core Web Vitals
- Monitor page load times
- Track user interactions

### Synthetic Monitoring
- Automated testing of critical user journeys
- Regular health checks
- Performance testing
- Uptime monitoring

## Incident Response

### Runbooks
Create runbooks for common issues:

#### Database Issues
1. Check database connectivity
2. Verify database health
3. Check connection pool status
4. Review database logs
5. Escalate if needed

#### High Error Rate
1. Check application logs
2. Verify external dependencies
3. Check system resources
4. Review recent deployments
5. Implement rollback if needed

#### Performance Issues
1. Check system resources
2. Review application metrics
3. Analyze slow queries
4. Check cache performance
5. Scale resources if needed

### Escalation Procedures
1. **Level 1**: On-call engineer
2. **Level 2**: Senior engineer
3. **Level 3**: Engineering manager
4. **Level 4**: CTO/VP Engineering

### Communication Channels
- Slack: #incidents
- Email: incidents@company.com
- PagerDuty: For critical alerts
- Status page: For public communication

## Testing Health Checks

### Unit Tests
```python
def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_detailed_health_endpoint():
    response = client.get("/health/detailed")
    assert response.status_code == 200
    assert "dependencies" in response.json()
    assert "metrics" in response.json()
```

### Integration Tests
```python
def test_database_health_check():
    # Test database connectivity
    response = client.get("/health/detailed")
    assert response.json()["dependencies"]["database"]["status"] == "healthy"

def test_redis_health_check():
    # Test Redis connectivity
    response = client.get("/health/detailed")
    assert response.json()["dependencies"]["redis"]["status"] == "healthy"
```

### Load Testing
- Use tools like k6 or Artillery
- Test health endpoints under load
- Verify performance under stress
- Test failover scenarios

## Maintenance

### Regular Tasks
- Review and update health check endpoints
- Monitor alert effectiveness
- Update runbooks
- Test incident response procedures
- Review and rotate monitoring credentials

### Health Check Maintenance
- Regular testing of health endpoints
- Monitoring health check performance
- Updating health check logic
- Reviewing health check thresholds
