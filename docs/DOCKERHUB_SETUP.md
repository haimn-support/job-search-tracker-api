# DockerHub Integration Setup Guide

## Overview
This guide explains how to set up GitHub Actions to automatically build and push Docker images to DockerHub for the Interview Position Tracker application.

## Prerequisites

### 1. DockerHub Account
- Create a DockerHub account at [hub.docker.com](https://hub.docker.com)
- Verify your email address

### 2. DockerHub Repository
Create repositories for your images:
- `your-username/job-search-tracker-api-backend`
- `your-username/job-search-tracker-api-frontend`

## GitHub Secrets Configuration

### Required Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### `DOCKERHUB_USERNAME`
- **Value**: Your DockerHub username
- **Example**: `myusername`

#### `DOCKERHUB_TOKEN`
- **Value**: Your DockerHub access token
- **How to create**:
  1. Go to DockerHub → Account Settings → Security
  2. Click "New Access Token"
  3. Give it a name (e.g., "GitHub Actions")
  4. Select "Read, Write, Delete" permissions
  5. Copy the generated token

## Workflow Files Created

### 1. Backend Docker Build (`backend-docker.yml`)
- **Triggers**: Push to `main`/`develop` branches, PRs to `main`
- **Paths**: Monitors changes in `app/`, `requirements.txt`, `Dockerfile`, etc.
- **Features**:
  - Multi-platform builds (linux/amd64, linux/arm64)
  - Automatic tagging (branch, SHA, latest, timestamp)
  - Security scanning with Trivy
  - Optional staging/production deployment

### 2. Frontend Docker Build (`frontend-docker.yml`)
- **Triggers**: Push to `main`/`develop` branches, PRs to `main`
- **Paths**: Monitors changes in `frontend/` directory
- **Features**:
  - Multi-platform builds
  - Automatic tagging
  - Security scanning

## Image Tagging Strategy

### Automatic Tags Generated:
- `latest` - Latest build from main branch
- `develop` - Latest build from develop branch
- `main-abc1234` - SHA-based tag for main branch
- `develop-def5678` - SHA-based tag for develop branch
- `20241225-143022` - Timestamp-based tag for main branch

### Example Images:
```
docker.io/yourusername/job-search-tracker-api-backend:latest
docker.io/yourusername/job-search-tracker-api-backend:develop
docker.io/yourusername/job-search-tracker-api-backend:main-abc1234
docker.io/yourusername/job-search-tracker-api-frontend:latest
docker.io/yourusername/job-search-tracker-api-frontend:develop
```

## Testing the Pipeline

### 1. Test Backend Build
```bash
# Make a small change to trigger the workflow
echo "# Test" >> app/README.md
git add app/README.md
git commit -m "test: trigger backend docker build"
git push origin develop
```

### 2. Test Frontend Build
```bash
# Make a small change to trigger the workflow
echo "/* Test */" >> frontend/src/App.tsx
git add frontend/src/App.tsx
git commit -m "test: trigger frontend docker build"
git push origin develop
```

### 3. Monitor Workflow
- Go to GitHub → Actions tab
- Watch the workflow execution
- Check for any failures or issues

## Using the Built Images

### Pull Images
```bash
# Pull latest backend image
docker pull yourusername/job-search-tracker-api-backend:latest

# Pull latest frontend image
docker pull yourusername/job-search-tracker-api-frontend:latest

# Pull specific version
docker pull yourusername/job-search-tracker-api-backend:develop
```

### Run Images Locally
```bash
# Run backend
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e SECRET_KEY=your-secret-key \
  yourusername/job-search-tracker-api-backend:latest

# Run frontend
docker run -p 3000:3000 \
  -e REACT_APP_API_URL=http://localhost:8000 \
  yourusername/job-search-tracker-api-frontend:latest
```

### Use in Kubernetes
```yaml
# Update your Kubernetes manifests
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    spec:
      containers:
      - name: api
        image: yourusername/job-search-tracker-api-backend:latest
        # ... rest of config
```

## Security Features

### 1. Vulnerability Scanning
- Automatic Trivy scans on every build
- Results uploaded to GitHub Security tab
- SARIF format for detailed analysis

### 2. Multi-Platform Builds
- Supports both AMD64 and ARM64 architectures
- Ensures compatibility across different systems

### 3. Build Caching
- Uses GitHub Actions cache for faster builds
- Reduces build time and resource usage

## Troubleshooting

### Common Issues

#### 1. Authentication Failed
```
Error: failed to push to registry
```
**Solution**: Check that `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are correctly set.

#### 2. Repository Not Found
```
Error: repository does not exist
```
**Solution**: Ensure DockerHub repositories exist and are public, or update the workflow with correct repository names.

#### 3. Build Context Too Large
```
Error: build context too large
```
**Solution**: Add more files to `.dockerignore` to reduce build context size.

### Debug Commands
```bash
# Check if secrets are set (in GitHub Actions)
echo "Username: ${{ secrets.DOCKERHUB_USERNAME }}"
echo "Token: ${{ secrets.DOCKERHUB_TOKEN }}"

# Test DockerHub login locally
docker login -u yourusername -p yourtoken

# Test image pull
docker pull yourusername/job-search-tracker-api-backend:latest
```

## Advanced Configuration

### 1. Custom Registry
To use a different registry (e.g., GitHub Container Registry):
```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}-backend
```

### 2. Environment-Specific Tags
```yaml
tags: |
  type=ref,event=branch
  type=raw,value=staging,enable={{is_default_branch}}
  type=raw,value=production,enable={{is_default_branch}}
```

### 3. Build Arguments
```yaml
build-args: |
  BUILD_DATE=${{ fromJSON(steps.meta.outputs.json).labels['org.opencontainers.image.created'] }}
  VCS_REF=${{ github.sha }}
  VERSION=${{ fromJSON(steps.meta.outputs.json).labels['org.opencontainers.image.version'] }}
  NODE_ENV=production
```

## Monitoring and Alerts

### 1. Workflow Notifications
- Set up email notifications for workflow failures
- Configure Slack/Discord webhooks for build status

### 2. Image Size Monitoring
- Monitor Docker image sizes over time
- Set up alerts for significant size increases

### 3. Security Alerts
- Enable GitHub Security Advisories
- Monitor Trivy scan results for new vulnerabilities

## Best Practices

### 1. Image Optimization
- Use multi-stage builds to reduce image size
- Remove unnecessary packages and files
- Use specific base image tags (not `latest`)

### 2. Security
- Regularly update base images
- Scan images for vulnerabilities
- Use non-root users in containers

### 3. Performance
- Enable build caching
- Use parallel builds when possible
- Optimize Dockerfile layers

## Next Steps

1. **Set up DockerHub secrets** in GitHub
2. **Create DockerHub repositories**
3. **Test the workflows** with a small change
4. **Monitor the builds** in GitHub Actions
5. **Verify images** are pushed to DockerHub
6. **Update deployment scripts** to use new images

## Support

If you encounter issues:
1. Check GitHub Actions logs for detailed error messages
2. Verify DockerHub credentials and permissions
3. Ensure DockerHub repositories exist and are accessible
4. Review the workflow files for any syntax errors
