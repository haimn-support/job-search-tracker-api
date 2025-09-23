# Production Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the Interview Position Tracker application to production environments using Docker, Kubernetes, and CI/CD pipelines.

## Prerequisites

### System Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- Kubernetes 1.20+ (for K8s deployment)
- kubectl configured
- Git
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Required Secrets
Before deployment, ensure you have the following secrets configured:

#### GitHub Secrets
- `SECRET_KEY`: Strong secret key for JWT token signing
- `POSTGRES_PASSWORD`: Database password
- `GITHUB_TOKEN`: GitHub token for container registry access
- `SLACK_WEBHOOK`: Slack webhook URL for deployment notifications

#### Optional Secrets
- `SENTRY_DSN`: Sentry DSN for error tracking
- `ANALYTICS_KEY`: Analytics service API key
- `EMAIL_SERVICE_KEY`: Email service API key
- `REDIS_PASSWORD`: Redis password for production

## Deployment Methods

### Method 1: Docker Compose (Recommended for Small-Medium Deployments)

#### Step 1: Prepare Environment
```bash
# Clone the repository
git clone https://github.com/your-username/job-search-tracker-api.git
cd job-search-tracker-api

# Generate secrets
./scripts/manage-secrets.sh generate production

# Review and update secrets
nano secrets/production.secrets
```

#### Step 2: Configure Environment Variables
```bash
# Create production environment file
cp .env.production.example .env.production

# Update environment variables
nano .env.production
```

#### Step 3: Deploy with Docker Compose
```bash
# Deploy the application
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check deployment status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Step 4: Verify Deployment
```bash
# Check API health
curl -f http://localhost:8000/health

# Check frontend health
curl -f http://localhost:3000/health

# Check database connectivity
docker-compose exec db psql -U postgres -d interview_tracker -c "SELECT 1;"
```

### Method 2: Kubernetes Deployment

#### Step 1: Prepare Kubernetes Manifests
```bash
# Create namespace
kubectl create namespace interview-tracker

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Apply config maps
kubectl apply -f k8s/configmap.yaml

# Apply persistent volumes
kubectl apply -f k8s/persistent-volumes.yaml
```

#### Step 2: Deploy Database
```bash
# Deploy PostgreSQL
kubectl apply -f k8s/postgresql.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgresql -n interview-tracker --timeout=300s
```

#### Step 3: Deploy Redis
```bash
# Deploy Redis
kubectl apply -f k8s/redis.yaml

# Wait for Redis to be ready
kubectl wait --for=condition=ready pod -l app=redis -n interview-tracker --timeout=300s
```

#### Step 4: Deploy API
```bash
# Deploy API
kubectl apply -f k8s/api.yaml

# Wait for API to be ready
kubectl wait --for=condition=ready pod -l app=api -n interview-tracker --timeout=300s
```

#### Step 5: Deploy Frontend
```bash
# Deploy frontend
kubectl apply -f k8s/frontend.yaml

# Wait for frontend to be ready
kubectl wait --for=condition=ready pod -l app=frontend -n interview-tracker --timeout=300s
```

#### Step 6: Deploy Ingress
```bash
# Deploy ingress
kubectl apply -f k8s/ingress.yaml

# Check ingress status
kubectl get ingress -n interview-tracker
```

### Method 3: CI/CD Pipeline Deployment

#### Step 1: Configure GitHub Actions
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the required secrets (see Prerequisites section)

#### Step 2: Trigger Deployment
```bash
# Push to main branch for production deployment
git push origin main

# Push to develop branch for staging deployment
git push origin develop
```

#### Step 3: Monitor Deployment
1. Go to GitHub Actions tab
2. Monitor the CI/CD pipeline progress
3. Check deployment logs
4. Verify health checks

## Environment-Specific Configurations

### Development Environment
```bash
# Start development environment
docker-compose up -d

# Access services
# API: http://localhost:8000
# Frontend: http://localhost:3000
# Database: localhost:5432
# Redis: localhost:6379
```

### Staging Environment
```bash
# Deploy to staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Run staging tests
npm run test:staging

# Run performance tests
npm run test:performance
```

### Production Environment
```bash
# Deploy to production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run production health checks
./scripts/health-check.sh production

# Monitor deployment
./scripts/monitor-deployment.sh
```

## Health Checks and Monitoring

### Health Check Endpoints
- **API Health**: `GET /health`
- **API Detailed Health**: `GET /health/detailed`
- **API Readiness**: `GET /health/ready`
- **API Liveness**: `GET /health/live`
- **Frontend Health**: `GET /health`

### Monitoring Setup
1. **Prometheus**: Metrics collection
2. **Grafana**: Dashboards and visualization
3. **AlertManager**: Alerting and notifications
4. **ELK Stack**: Log aggregation and analysis

### Health Check Script
```bash
#!/bin/bash
# Health check script for production deployment

API_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

echo "Checking API health..."
if curl -f "$API_URL/health" > /dev/null 2>&1; then
    echo "✓ API is healthy"
else
    echo "✗ API health check failed"
    exit 1
fi

echo "Checking frontend health..."
if curl -f "$FRONTEND_URL/health" > /dev/null 2>&1; then
    echo "✓ Frontend is healthy"
else
    echo "✗ Frontend health check failed"
    exit 1
fi

echo "All health checks passed!"
```

## Database Management

### Database Migrations
```bash
# Run migrations
docker-compose exec api alembic upgrade head

# Check migration status
docker-compose exec api alembic current

# Create new migration
docker-compose exec api alembic revision --autogenerate -m "Description"
```

### Database Backups
```bash
# Create backup
docker-compose exec db pg_dump -U postgres interview_tracker > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T db psql -U postgres interview_tracker < backup_file.sql
```

## SSL/TLS Configuration

### Let's Encrypt Setup
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

### SSL Certificate Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Scaling and Performance

### Horizontal Scaling
```bash
# Scale API replicas
kubectl scale deployment api --replicas=3 -n interview-tracker

# Scale frontend replicas
kubectl scale deployment frontend --replicas=2 -n interview-tracker
```

### Load Balancing
- Use nginx or HAProxy for load balancing
- Configure sticky sessions if needed
- Implement health checks for load balancer

### Caching Strategy
- Redis for session storage
- CDN for static assets
- Browser caching for frontend assets
- Database query caching

## Security Considerations

### Container Security
- Use non-root users in containers
- Scan images for vulnerabilities
- Keep base images updated
- Use minimal base images

### Network Security
- Use private networks for internal communication
- Implement proper firewall rules
- Use TLS for all external communication
- Implement rate limiting

### Data Security
- Encrypt data at rest
- Use secure communication protocols
- Implement proper access controls
- Regular security audits

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
docker-compose exec db pg_isready -U postgres

# Check database logs
docker-compose logs db

# Test database connection
docker-compose exec api python -c "from app.database import engine; print(engine.execute('SELECT 1').scalar())"
```

#### API Health Check Failures
```bash
# Check API logs
docker-compose logs api

# Check API status
docker-compose exec api curl -f http://localhost:8000/health

# Check API dependencies
docker-compose exec api curl -f http://localhost:8000/health/detailed
```

#### Frontend Build Issues
```bash
# Check frontend build logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend

# Check frontend health
docker-compose exec frontend curl -f http://localhost:3000/health
```

### Debugging Commands
```bash
# View all container logs
docker-compose logs

# View specific service logs
docker-compose logs api

# Execute commands in running container
docker-compose exec api bash

# Check container resource usage
docker stats

# Check container health status
docker-compose ps
```

## Maintenance and Updates

### Regular Maintenance Tasks
1. **Security Updates**: Keep base images and dependencies updated
2. **Database Maintenance**: Regular backups and optimization
3. **Log Rotation**: Implement log rotation and cleanup
4. **Monitoring**: Review and update monitoring configurations
5. **Performance**: Regular performance testing and optimization

### Update Procedures
1. **Test Updates**: Test updates in staging environment first
2. **Backup Data**: Create database backups before updates
3. **Rollback Plan**: Have rollback procedures ready
4. **Monitor Deployment**: Monitor deployment and health checks
5. **Verify Functionality**: Test critical functionality after updates

### Rollback Procedures
```bash
# Rollback to previous version
docker-compose down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rollback database (if needed)
docker-compose exec db psql -U postgres interview_tracker < backup_file.sql

# Verify rollback
./scripts/health-check.sh production
```

## Support and Documentation

### Documentation Links
- [API Documentation](http://localhost:8000/docs)
- [Frontend Documentation](frontend/README.md)
- [Health Monitoring Guide](docs/HEALTH_MONITORING.md)
- [Environment Configuration](docs/ENVIRONMENT_CONFIGURATION.md)

### Support Channels
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@company.com
- **Slack**: #support channel

### Emergency Contacts
- **On-call Engineer**: +1-XXX-XXX-XXXX
- **Engineering Manager**: +1-XXX-XXX-XXXX
- **CTO**: +1-XXX-XXX-XXXX
