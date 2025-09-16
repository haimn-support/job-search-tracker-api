# Deployment Guide

This guide covers different deployment scenarios for the Interview Position Tracker API.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Compose](#docker-compose)
3. [Kubernetes](#kubernetes)
4. [Production Considerations](#production-considerations)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL 12+
- Git

### Setup
```bash
# Clone repository
git clone <repository-url>
cd interview-position-tracker-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

## Docker Compose

### Development Environment

**Quick Start:**
```bash
# Copy environment configuration
cp .env.docker .env

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api

# Run tests in container
docker-compose exec api pytest

# Stop services
docker-compose down
```

### Production Environment

**Setup:**
```bash
# Create production environment file
cp .env.docker .env.prod

# Edit .env.prod with production values:
# - Strong SECRET_KEY
# - Secure database password
# - Production CORS origins
# - Appropriate log levels
```

**Deploy:**
```bash
# Set environment variables
export POSTGRES_PASSWORD="your-secure-password"
export SECRET_KEY="your-production-secret-key"
export BACKEND_CORS_ORIGINS='["https://your-frontend.com"]'

# Deploy with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify deployment
curl http://localhost:8000/health
```

## Kubernetes

### Prerequisites
- Kubernetes cluster (1.19+)
- kubectl configured
- Container registry access
- Persistent storage support

### Build and Push Image

```bash
# Build image
./scripts/build-docker.sh latest

# Tag for your registry
docker tag interview-tracker-api:latest your-registry.com/interview-tracker-api:latest

# Push to registry
docker push your-registry.com/interview-tracker-api:latest
```

### Configuration

**1. Update Image Reference:**
```bash
# Edit k8s/api-deployment.yaml
# Change: image: interview-tracker-api:latest
# To: image: your-registry.com/interview-tracker-api:latest
```

**2. Configure Secrets:**
```bash
# Generate base64 encoded secrets
echo -n "your-production-secret-key" | base64
echo -n "your-database-password" | base64

# Update k8s/secret.yaml with encoded values
```

**3. Configure Domain (Optional):**
```bash
# Edit k8s/api-service.yaml
# Update host: api.your-domain.com
# Configure TLS if needed
```

### Deployment

**Automated Deployment:**
```bash
# Deploy everything
./scripts/deploy-k8s.sh

# Check status
./scripts/deploy-k8s.sh status

# View logs
./scripts/deploy-k8s.sh logs
```

**Manual Deployment:**
```bash
# Create namespace and configuration
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy database and cache
kubectl apply -f k8s/postgresql.yaml
kubectl apply -f k8s/redis.yaml

# Wait for database
kubectl wait --for=condition=available --timeout=300s deployment/postgresql -n interview-tracker

# Run migration
kubectl apply -f k8s/migration-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/interview-tracker-migration -n interview-tracker

# Deploy API
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
kubectl apply -f k8s/hpa.yaml

# Verify deployment
kubectl get pods -n interview-tracker
kubectl get services -n interview-tracker
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment interview-tracker-api --replicas=5 -n interview-tracker

# Auto-scaling is configured via HPA:
# - Min replicas: 2
# - Max replicas: 10
# - CPU threshold: 70%
# - Memory threshold: 80%
```

### Updates

```bash
# Rolling update
kubectl set image deployment/interview-tracker-api api=your-registry.com/interview-tracker-api:v2.0.0 -n interview-tracker

# Check rollout status
kubectl rollout status deployment/interview-tracker-api -n interview-tracker

# Rollback if needed
kubectl rollout undo deployment/interview-tracker-api -n interview-tracker
```

## Production Considerations

### Security

**Environment Variables:**
- Use strong, unique `SECRET_KEY`
- Secure database passwords
- Restrict CORS origins
- Set appropriate log levels

**Container Security:**
- Containers run as non-root user
- Security contexts configured
- Resource limits enforced
- Regular image updates

**Network Security:**
- Use TLS/HTTPS in production
- Configure ingress with rate limiting
- Implement network policies
- Regular security scanning

### Performance

**Database:**
- Use connection pooling
- Configure appropriate pool sizes
- Regular maintenance and backups
- Monitor query performance

**Application:**
- Configure appropriate worker processes
- Set resource limits
- Use caching where appropriate
- Monitor response times

**Infrastructure:**
- Use load balancers
- Configure auto-scaling
- Monitor resource usage
- Plan for capacity

### Backup & Recovery

**Database Backups:**
```bash
# PostgreSQL backup
kubectl exec -n interview-tracker deployment/postgresql -- pg_dump -U postgres interview_tracker > backup.sql

# Restore
kubectl exec -i -n interview-tracker deployment/postgresql -- psql -U postgres interview_tracker < backup.sql
```

**Configuration Backups:**
```bash
# Export Kubernetes resources
kubectl get all,configmap,secret,pvc -n interview-tracker -o yaml > k8s-backup.yaml
```

## Monitoring & Maintenance

### Health Checks

**Endpoints:**
- `/health` - Basic health check
- `/health/detailed` - Comprehensive system status
- `/health/readiness` - Kubernetes readiness probe
- `/health/liveness` - Kubernetes liveness probe

**Monitoring:**
```bash
# Check API health
curl http://your-api-url/health

# Check detailed status
curl http://your-api-url/health/detailed

# Kubernetes health
kubectl get pods -n interview-tracker
kubectl describe pod <pod-name> -n interview-tracker
```

### Logging

**View Logs:**
```bash
# Docker Compose
docker-compose logs -f api

# Kubernetes
kubectl logs -f deployment/interview-tracker-api -n interview-tracker
kubectl logs -l component=api -n interview-tracker --tail=100
```

**Log Levels:**
- `DEBUG` - Development only
- `INFO` - General information
- `WARNING` - Production default
- `ERROR` - Errors only

### Metrics

**Application Metrics:**
- Response times
- Request counts
- Error rates
- Database connection pool status

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Disk usage
- Network traffic

### Maintenance Tasks

**Regular Tasks:**
- Update dependencies
- Security patches
- Database maintenance
- Log rotation
- Backup verification

**Database Migrations:**
```bash
# Docker Compose
docker-compose exec api alembic upgrade head

# Kubernetes
kubectl apply -f k8s/migration-job.yaml
```

## Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check database status
kubectl get pods -n interview-tracker
kubectl logs deployment/postgresql -n interview-tracker

# Test connection
kubectl exec -it deployment/postgresql -n interview-tracker -- psql -U postgres -d interview_tracker -c "SELECT 1;"
```

**API Not Starting:**
```bash
# Check logs
kubectl logs deployment/interview-tracker-api -n interview-tracker

# Check configuration
kubectl describe configmap interview-tracker-config -n interview-tracker
kubectl describe secret interview-tracker-secrets -n interview-tracker
```

**Performance Issues:**
```bash
# Check resource usage
kubectl top pods -n interview-tracker
kubectl describe hpa interview-tracker-api-hpa -n interview-tracker

# Check database performance
kubectl exec -it deployment/postgresql -n interview-tracker -- psql -U postgres -d interview_tracker -c "SELECT * FROM pg_stat_activity;"
```

### Debug Commands

```bash
# Get pod shell
kubectl exec -it deployment/interview-tracker-api -n interview-tracker -- /bin/bash

# Check environment variables
kubectl exec deployment/interview-tracker-api -n interview-tracker -- env

# Test API endpoints
kubectl port-forward service/interview-tracker-api-service 8000:80 -n interview-tracker
curl http://localhost:8000/health

# Check ingress
kubectl describe ingress interview-tracker-ingress -n interview-tracker
```

### Recovery Procedures

**Database Recovery:**
```bash
# Restore from backup
kubectl exec -i deployment/postgresql -n interview-tracker -- psql -U postgres interview_tracker < backup.sql

# Reset database (CAUTION: Data loss)
kubectl delete pvc postgresql-pvc -n interview-tracker
kubectl delete deployment postgresql -n interview-tracker
kubectl apply -f k8s/postgresql.yaml
```

**Application Recovery:**
```bash
# Restart deployment
kubectl rollout restart deployment/interview-tracker-api -n interview-tracker

# Scale down and up
kubectl scale deployment interview-tracker-api --replicas=0 -n interview-tracker
kubectl scale deployment interview-tracker-api --replicas=3 -n interview-tracker
```

**Complete Reset:**
```bash
# WARNING: This will delete all data
./scripts/deploy-k8s.sh cleanup
./scripts/deploy-k8s.sh deploy
```

## Support

For additional support:
1. Check application logs
2. Review Kubernetes events
3. Verify configuration
4. Test connectivity
5. Check resource availability

Remember to always test changes in a non-production environment first!