#!/bin/bash

# DockerHub GitHub Actions Setup Script
# This script helps you set up DockerHub integration with GitHub Actions

set -e

echo "🐳 DockerHub GitHub Actions Setup"
echo "================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get repository info
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename "$REPO_URL" .git)

echo "📋 Repository Information:"
echo "   Name: $REPO_NAME"
echo "   URL: $REPO_URL"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    echo "   Or set up secrets manually in GitHub web interface"
    echo ""
    echo "📝 Manual Setup Instructions:"
    echo "   1. Go to: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\)\.git/\1/')/settings/secrets/actions"
    echo "   2. Add these secrets:"
    echo "      - DOCKERHUB_USERNAME: Your DockerHub username"
    echo "      - DOCKERHUB_TOKEN: Your DockerHub access token"
    echo ""
    exit 0
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub CLI"
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Get DockerHub credentials
echo "🔐 DockerHub Credentials Setup"
echo "==============================="
echo ""

read -p "Enter your DockerHub username: " DOCKERHUB_USERNAME

if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo "❌ DockerHub username is required"
    exit 1
fi

echo ""
echo "📝 DockerHub Access Token Setup:"
echo "   1. Go to: https://hub.docker.com/settings/security"
echo "   2. Click 'New Access Token'"
echo "   3. Give it a name (e.g., 'GitHub Actions')"
echo "   4. Select 'Read, Write, Delete' permissions"
echo "   5. Copy the generated token"
echo ""

read -p "Enter your DockerHub access token: " DOCKERHUB_TOKEN

if [ -z "$DOCKERHUB_TOKEN" ]; then
    echo "❌ DockerHub access token is required"
    exit 1
fi

echo ""
echo "🔧 Setting up GitHub secrets..."

# Set the secrets
gh secret set DOCKERHUB_USERNAME --body "$DOCKERHUB_USERNAME"
gh secret set DOCKERHUB_TOKEN --body "$DOCKERHUB_TOKEN"

echo "✅ GitHub secrets configured successfully!"
echo ""

# Check if DockerHub repositories exist
echo "📦 Checking DockerHub repositories..."

BACKEND_REPO="$DOCKERHUB_USERNAME/$REPO_NAME"
FRONTEND_REPO="$DOCKERHUB_USERNAME/$REPO_NAME-frontend"

echo "   Backend repository: $BACKEND_REPO"
echo "   Frontend repository: $FRONTEND_REPO"
echo ""

# Test DockerHub login
echo "🔍 Testing DockerHub connection..."
if docker login -u "$DOCKERHUB_USERNAME" -p "$DOCKERHUB_TOKEN" &> /dev/null; then
    echo "✅ DockerHub login successful"
else
    echo "❌ DockerHub login failed"
    echo "   Please check your credentials"
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "   1. Create DockerHub repositories if they don't exist:"
echo "      - https://hub.docker.com/repository/create?namespace=$DOCKERHUB_USERNAME&name=$REPO_NAME"
echo "      - https://hub.docker.com/repository/create?namespace=$DOCKERHUB_USERNAME&name=$REPO_NAME-frontend"
echo ""
echo "   2. Push changes to trigger the workflow:"
echo "      git add ."
echo "      git commit -m 'feat: add DockerHub CI/CD pipeline'"
echo "      git push origin main"
echo ""
echo "   3. Monitor the workflow:"
echo "      gh run list"
echo "      gh run watch"
echo ""
echo "🐳 Your Docker images will be available at:"
echo "   Backend:  docker.io/$BACKEND_REPO"
echo "   Frontend: docker.io/$FRONTEND_REPO"
echo ""

# Create a test commit to trigger the workflow
read -p "Would you like to create a test commit to trigger the workflow? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 Creating test commit..."
    
    # Create a simple test file
    echo "# DockerHub CI/CD Test" > .dockerhub-test.md
    echo "This file was created to test the DockerHub CI/CD pipeline." >> .dockerhub-test.md
    echo "Generated on: $(date)" >> .dockerhub-test.md
    
    git add .dockerhub-test.md
    git commit -m "test: trigger DockerHub CI/CD pipeline"
    
    echo "✅ Test commit created"
    echo ""
    echo "🚀 Pushing to trigger workflow..."
    git push origin main
    
    echo ""
    echo "📊 Monitor the workflow:"
    echo "   gh run list"
    echo "   gh run watch"
else
    echo "ℹ️  You can trigger the workflow later by pushing changes to the main branch"
fi

echo ""
echo "🎯 Setup completed successfully!"
