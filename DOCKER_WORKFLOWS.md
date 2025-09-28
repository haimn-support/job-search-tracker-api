# Docker Release Workflows

This repository includes GitHub Actions workflows for building and pushing Docker images to Docker Hub with custom version tags.

## Available Workflows

### 1. Docker Release (Full Featured)
**File:** `.github/workflows/docker-release.yml`

A comprehensive workflow with security scanning and detailed metadata.

**Features:**
- Manual trigger with version tag input
- Multi-platform builds (AMD64, ARM64)
- Security scanning with Trivy
- Detailed build metadata and labels
- Customizable Docker Hub repository

**Usage:**
1. Go to Actions tab in GitHub
2. Select "Docker Release" workflow
3. Click "Run workflow"
4. Enter version tag (default: `latest`)
5. Optionally customize Docker Hub username/repository

### 2. Quick Docker Release (Simple)
**File:** `.github/workflows/quick-release.yml`

A lightweight workflow for quick releases.

**Features:**
- Simple manual trigger
- Fast build and push
- Always tags as both version and `latest`

**Usage:**
1. Go to Actions tab in GitHub
2. Select "Quick Docker Release" workflow
3. Click "Run workflow"
4. Enter version tag (default: `latest`)

## Required Secrets

Set these secrets in your GitHub repository settings:

- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token

## Docker Hub Setup

1. Create a Docker Hub account
2. Generate an access token:
   - Go to Docker Hub → Account Settings → Security
   - Create a new access token
3. Add the token to GitHub secrets

## Example Usage

### Release version 1.2.3:
```bash
# Using the full workflow
Version tag: 1.2.3
# Results in: haim9798/job-search-tracker-api:1.2.3

# Using the quick workflow  
Version: 1.2.3
# Results in: haim9798/job-search-tracker-api:1.2.3 and haim9798/job-search-tracker-api:latest
```

### Release latest:
```bash
# Using either workflow with default values
# Results in: haim9798/job-search-tracker-api:latest
```

## Pull Commands

After successful build, pull the image with:

```bash
# Specific version
docker pull haim9798/job-search-tracker-api:1.2.3

# Latest version
docker pull haim9798/job-search-tracker-api:latest
```

## Build Information

The Docker images include build metadata:
- Version tag
- Build date
- Git commit hash
- Repository URL
- Vendor information

View metadata with:
```bash
docker inspect haim9798/job-search-tracker-api:latest
```
