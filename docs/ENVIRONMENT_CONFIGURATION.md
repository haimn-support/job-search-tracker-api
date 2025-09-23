# Environment Variables and Secrets Management

## Overview
This document outlines the environment variables and secrets management strategy for the Interview Position Tracker application across different environments.

## Environment Configuration Files

### Development Environment (.env.development)
```bash
# Application Configuration
REACT_APP_ENV=development
REACT_APP_API_URL=http://localhost:8000
REACT_APP_APP_NAME=Interview Position Tracker
REACT_APP_VERSION=1.0.0
REACT_APP_DEBUG=true
REACT_APP_ENABLE_DEVTOOLS=true
REACT_APP_LOG_LEVEL=debug
GENERATE_SOURCEMAP=true

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/interview_tracker_dev

# Security Configuration
SECRET_KEY=dev-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256

# CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8080"]

# Logging Configuration
LOG_LEVEL=DEBUG
```

### Staging Environment (.env.staging)
```bash
# Application Configuration
REACT_APP_ENV=staging
REACT_APP_API_URL=https://api-staging.interview-tracker.com
REACT_APP_APP_NAME=Interview Position Tracker
REACT_APP_VERSION=1.0.0
REACT_APP_DEBUG=false
REACT_APP_ENABLE_DEVTOOLS=false
REACT_APP_LOG_LEVEL=info
GENERATE_SOURCEMAP=false

# Database Configuration
DATABASE_URL=postgresql://staging_user:${POSTGRES_PASSWORD}@staging-db:5432/interview_tracker_staging

# Security Configuration
SECRET_KEY=${SECRET_KEY}
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# CORS Configuration
BACKEND_CORS_ORIGINS=["https://staging.interview-tracker.com"]

# Logging Configuration
LOG_LEVEL=INFO
```

### Production Environment (.env.production)
```bash
# Application Configuration
REACT_APP_ENV=production
REACT_APP_API_URL=https://api.interview-tracker.com
REACT_APP_APP_NAME=Interview Position Tracker
REACT_APP_VERSION=1.0.0
REACT_APP_DEBUG=false
REACT_APP_ENABLE_DEVTOOLS=false
REACT_APP_LOG_LEVEL=error
GENERATE_SOURCEMAP=false

# Database Configuration
DATABASE_URL=postgresql://prod_user:${POSTGRES_PASSWORD}@prod-db:5432/interview_tracker_prod

# Security Configuration
SECRET_KEY=${SECRET_KEY}
ACCESS_TOKEN_EXPIRE_MINUTES=15
ALGORITHM=HS256

# CORS Configuration
BACKEND_CORS_ORIGINS=["https://interview-tracker.com"]

# Logging Configuration
LOG_LEVEL=WARNING
```

## Secrets Management

### GitHub Secrets
The following secrets should be configured in GitHub repository settings:

#### Required Secrets
- `SECRET_KEY`: Strong secret key for JWT token signing
- `POSTGRES_PASSWORD`: Database password
- `GITHUB_TOKEN`: GitHub token for container registry access
- `SLACK_WEBHOOK`: Slack webhook URL for deployment notifications

#### Optional Secrets
- `SENTRY_DSN`: Sentry DSN for error tracking
- `ANALYTICS_KEY`: Analytics service API key
- `EMAIL_SERVICE_KEY`: Email service API key
- `REDIS_PASSWORD`: Redis password for production

### Docker Secrets
For production deployments, use Docker secrets for sensitive data:

```yaml
# docker-compose.prod.yml
services:
  api:
    secrets:
      - secret_key
      - db_password
    environment:
      SECRET_KEY_FILE: /run/secrets/secret_key
      DATABASE_PASSWORD_FILE: /run/secrets/db_password

secrets:
  secret_key:
    external: true
  db_password:
    external: true
```

### Kubernetes Secrets
For Kubernetes deployments:

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: interview-tracker-secrets
type: Opaque
data:
  secret-key: <base64-encoded-secret>
  db-password: <base64-encoded-password>
  redis-password: <base64-encoded-redis-password>
```

## Environment-Specific Configurations

### Development
- Debug mode enabled
- Source maps generated
- DevTools enabled
- Verbose logging
- Hot reload enabled
- Local database connections

### Staging
- Production-like optimizations
- Performance monitoring enabled
- Moderate logging
- Staging database
- Limited debug features

### Production
- All optimizations enabled
- Source maps disabled
- Performance monitoring enabled
- Error-level logging only
- Production database
- Security hardening enabled

## Security Best Practices

### Secret Rotation
- Rotate secrets regularly (every 90 days)
- Use different secrets per environment
- Implement secret versioning
- Monitor secret usage

### Access Control
- Limit access to production secrets
- Use least privilege principle
- Implement audit logging
- Regular access reviews

### Encryption
- Encrypt secrets at rest
- Use TLS for secrets in transit
- Implement proper key management
- Use secure secret storage solutions

## Monitoring and Alerting

### Secret Monitoring
- Monitor secret access patterns
- Alert on unusual secret usage
- Track secret rotation status
- Monitor failed authentication attempts

### Environment Monitoring
- Monitor environment variable changes
- Track configuration drift
- Alert on missing required variables
- Monitor environment health

## Deployment Configuration

### Environment Variables in CI/CD
```yaml
# .github/workflows/ci-cd.yml
env:
  NODE_ENV: production
  REACT_APP_ENV: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
  REACT_APP_API_URL: ${{ github.ref == 'refs/heads/main' && 'https://api.interview-tracker.com' || 'https://api-staging.interview-tracker.com' }}
```

### Docker Environment Variables
```dockerfile
# Dockerfile
ENV NODE_ENV=production
ENV REACT_APP_ENV=production
ENV REACT_APP_API_URL=https://api.interview-tracker.com
```

## Validation and Testing

### Environment Validation
- Validate required environment variables
- Check environment variable formats
- Test environment-specific configurations
- Validate secret connectivity

### Configuration Testing
- Test environment variable loading
- Validate secret decryption
- Test environment-specific features
- Validate configuration changes

## Troubleshooting

### Common Issues
- Missing environment variables
- Incorrect secret values
- Environment variable conflicts
- Secret access permissions

### Debugging Steps
1. Check environment variable values
2. Verify secret access permissions
3. Test configuration loading
4. Check environment-specific logs
5. Validate network connectivity

## Migration and Updates

### Environment Variable Updates
- Document all changes
- Test in staging first
- Implement gradual rollout
- Monitor for issues

### Secret Updates
- Plan secret rotation
- Update all environments
- Test authentication
- Monitor for failures
