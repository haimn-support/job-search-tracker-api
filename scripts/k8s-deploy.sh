#!/bin/bash

# Kubernetes Deployment Script for Interview Position Tracker
# This script automates the deployment process to Kubernetes

set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/k8s"
NAMESPACE="interview-tracker"

# Function to display usage
usage() {
    echo "Usage: $0 {deploy|undeploy|status|logs|restart} [service]"
    echo ""
    echo "Commands:"
    echo "  deploy   - Deploy the application to Kubernetes"
    echo "  undeploy - Remove the application from Kubernetes"
    echo "  status   - Show deployment status"
    echo "  logs     - Show logs for a service"
    echo "  restart  - Restart a service"
    echo ""
    echo "Services: api, frontend, postgresql, redis"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 status"
    echo "  $0 logs api"
    echo "  $0 restart frontend"
    exit 1
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}Error: kubectl is not installed${NC}"
        exit 1
    fi
    
    # Check if kubectl is configured
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}Error: kubectl is not configured or cluster is not accessible${NC}"
        exit 1
    fi
    
    # Check if K8s directory exists
    if [ ! -d "$K8S_DIR" ]; then
        echo -e "${RED}Error: Kubernetes manifests directory not found: $K8S_DIR${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Prerequisites check passed${NC}"
}

# Function to deploy the application
deploy() {
    echo -e "${YELLOW}Deploying Interview Position Tracker to Kubernetes...${NC}"
    
    # Create namespace
    echo -e "${YELLOW}Creating namespace...${NC}"
    kubectl apply -f "$K8S_DIR/namespace.yaml"
    
    # Apply secrets
    echo -e "${YELLOW}Applying secrets...${NC}"
    kubectl apply -f "$K8S_DIR/secrets.yaml"
    
    # Apply config maps
    echo -e "${YELLOW}Applying config maps...${NC}"
    kubectl apply -f "$K8S_DIR/configmap.yaml"
    
    # Apply persistent volumes
    echo -e "${YELLOW}Applying persistent volumes...${NC}"
    kubectl apply -f "$K8S_DIR/persistent-volumes.yaml"
    
    # Deploy database
    echo -e "${YELLOW}Deploying PostgreSQL...${NC}"
    kubectl apply -f "$K8S_DIR/postgresql.yaml"
    
    # Wait for database to be ready
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=postgresql -n $NAMESPACE --timeout=300s
    
    # Deploy Redis
    echo -e "${YELLOW}Deploying Redis...${NC}"
    kubectl apply -f "$K8S_DIR/redis.yaml"
    
    # Wait for Redis to be ready
    echo -e "${YELLOW}Waiting for Redis to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s
    
    # Deploy API
    echo -e "${YELLOW}Deploying API...${NC}"
    kubectl apply -f "$K8S_DIR/api.yaml"
    
    # Wait for API to be ready
    echo -e "${YELLOW}Waiting for API to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=api -n $NAMESPACE --timeout=300s
    
    # Deploy frontend
    echo -e "${YELLOW}Deploying frontend...${NC}"
    kubectl apply -f "$K8S_DIR/frontend.yaml"
    
    # Wait for frontend to be ready
    echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=frontend -n $NAMESPACE --timeout=300s
    
    # Deploy ingress
    echo -e "${YELLOW}Deploying ingress...${NC}"
    kubectl apply -f "$K8S_DIR/ingress.yaml"
    
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo -e "${YELLOW}You can check the status with: $0 status${NC}"
}

# Function to undeploy the application
undeploy() {
    echo -e "${YELLOW}Undeploying Interview Position Tracker from Kubernetes...${NC}"
    
    # Remove ingress
    echo -e "${YELLOW}Removing ingress...${NC}"
    kubectl delete -f "$K8S_DIR/ingress.yaml" --ignore-not-found=true
    
    # Remove frontend
    echo -e "${YELLOW}Removing frontend...${NC}"
    kubectl delete -f "$K8S_DIR/frontend.yaml" --ignore-not-found=true
    
    # Remove API
    echo -e "${YELLOW}Removing API...${NC}"
    kubectl delete -f "$K8S_DIR/api.yaml" --ignore-not-found=true
    
    # Remove Redis
    echo -e "${YELLOW}Removing Redis...${NC}"
    kubectl delete -f "$K8S_DIR/redis.yaml" --ignore-not-found=true
    
    # Remove PostgreSQL
    echo -e "${YELLOW}Removing PostgreSQL...${NC}"
    kubectl delete -f "$K8S_DIR/postgresql.yaml" --ignore-not-found=true
    
    # Remove persistent volumes
    echo -e "${YELLOW}Removing persistent volumes...${NC}"
    kubectl delete -f "$K8S_DIR/persistent-volumes.yaml" --ignore-not-found=true
    
    # Remove config maps
    echo -e "${YELLOW}Removing config maps...${NC}"
    kubectl delete -f "$K8S_DIR/configmap.yaml" --ignore-not-found=true
    
    # Remove secrets
    echo -e "${YELLOW}Removing secrets...${NC}"
    kubectl delete -f "$K8S_DIR/secrets.yaml" --ignore-not-found=true
    
    # Remove namespace
    echo -e "${YELLOW}Removing namespace...${NC}"
    kubectl delete -f "$K8S_DIR/namespace.yaml" --ignore-not-found=true
    
    echo -e "${GREEN}Undeployment completed successfully!${NC}"
}

# Function to show deployment status
status() {
    echo -e "${YELLOW}Deployment Status:${NC}"
    echo ""
    
    # Show namespace status
    echo -e "${YELLOW}Namespace:${NC}"
    kubectl get namespace $NAMESPACE 2>/dev/null || echo -e "${RED}Namespace not found${NC}"
    echo ""
    
    # Show pods status
    echo -e "${YELLOW}Pods:${NC}"
    kubectl get pods -n $NAMESPACE 2>/dev/null || echo -e "${RED}No pods found${NC}"
    echo ""
    
    # Show services status
    echo -e "${YELLOW}Services:${NC}"
    kubectl get services -n $NAMESPACE 2>/dev/null || echo -e "${RED}No services found${NC}"
    echo ""
    
    # Show ingress status
    echo -e "${YELLOW}Ingress:${NC}"
    kubectl get ingress -n $NAMESPACE 2>/dev/null || echo -e "${RED}No ingress found${NC}"
    echo ""
    
    # Show persistent volumes status
    echo -e "${YELLOW}Persistent Volumes:${NC}"
    kubectl get pvc -n $NAMESPACE 2>/dev/null || echo -e "${RED}No persistent volumes found${NC}"
    echo ""
    
    # Show horizontal pod autoscalers
    echo -e "${YELLOW}Horizontal Pod Autoscalers:${NC}"
    kubectl get hpa -n $NAMESPACE 2>/dev/null || echo -e "${RED}No HPA found${NC}"
    echo ""
}

# Function to show logs
logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service not specified${NC}"
        echo "Available services: api, frontend, postgresql, redis"
        exit 1
    fi
    
    echo -e "${YELLOW}Showing logs for $service...${NC}"
    kubectl logs -f deployment/$service -n $NAMESPACE
}

# Function to restart a service
restart() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service not specified${NC}"
        echo "Available services: api, frontend, postgresql, redis"
        exit 1
    fi
    
    echo -e "${YELLOW}Restarting $service...${NC}"
    kubectl rollout restart deployment/$service -n $NAMESPACE
    
    echo -e "${YELLOW}Waiting for $service to be ready...${NC}"
    kubectl rollout status deployment/$service -n $NAMESPACE
    
    echo -e "${GREEN}$service restarted successfully!${NC}"
}

# Function to run health checks
health_check() {
    echo -e "${YELLOW}Running health checks...${NC}"
    
    # Check API health
    echo -e "${YELLOW}Checking API health...${NC}"
    kubectl exec -n $NAMESPACE deployment/api -- curl -f http://localhost:8000/health || echo -e "${RED}API health check failed${NC}"
    
    # Check frontend health
    echo -e "${YELLOW}Checking frontend health...${NC}"
    kubectl exec -n $NAMESPACE deployment/frontend -- curl -f http://localhost:3000/health || echo -e "${RED}Frontend health check failed${NC}"
    
    # Check database connectivity
    echo -e "${YELLOW}Checking database connectivity...${NC}"
    kubectl exec -n $NAMESPACE deployment/postgresql -- pg_isready -U postgres -d interview_tracker || echo -e "${RED}Database health check failed${NC}"
    
    # Check Redis connectivity
    echo -e "${YELLOW}Checking Redis connectivity...${NC}"
    kubectl exec -n $NAMESPACE deployment/redis -- redis-cli ping || echo -e "${RED}Redis health check failed${NC}"
    
    echo -e "${GREEN}Health checks completed!${NC}"
}

# Main script logic
main() {
    local command=$1
    local service=$2
    
    # Check prerequisites
    check_prerequisites
    
    # Execute command
    case $command in
        "deploy")
            deploy
            ;;
        "undeploy")
            undeploy
            ;;
        "status")
            status
            ;;
        "logs")
            logs "$service"
            ;;
        "restart")
            restart "$service"
            ;;
        "health")
            health_check
            ;;
        "help"|"-h"|"--help")
            usage
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$command'${NC}"
            usage
            ;;
    esac
}

# Run main function with all arguments
main "$@"
