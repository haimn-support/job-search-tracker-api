#!/bin/bash

# Build script for Interview Position Tracker API Docker image

set -e

# Configuration
IMAGE_NAME="interview-tracker-api"
TAG="${1:-latest}"
REGISTRY="${DOCKER_REGISTRY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Building Interview Position Tracker API Docker image...${NC}"

# Build the image
echo -e "${YELLOW}Building image: ${IMAGE_NAME}:${TAG}${NC}"
docker build -t "${IMAGE_NAME}:${TAG}" .

# Tag for registry if specified
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"
    echo -e "${YELLOW}Tagging for registry: ${FULL_IMAGE_NAME}${NC}"
    docker tag "${IMAGE_NAME}:${TAG}" "${FULL_IMAGE_NAME}"
fi

# Show image info
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${YELLOW}Image details:${NC}"
docker images "${IMAGE_NAME}:${TAG}"

# Optional: Run security scan if trivy is available
if command -v trivy &> /dev/null; then
    echo -e "${YELLOW}🔍 Running security scan...${NC}"
    trivy image "${IMAGE_NAME}:${TAG}"
fi

echo -e "${GREEN}🚀 Image ready for deployment!${NC}"

# Show usage instructions
echo -e "${YELLOW}Usage:${NC}"
echo "  Local run:     docker run -p 8000:8000 ${IMAGE_NAME}:${TAG}"
echo "  Docker Compose: docker-compose up"
if [ -n "$REGISTRY" ]; then
    echo "  Push to registry: docker push ${FULL_IMAGE_NAME}"
fi