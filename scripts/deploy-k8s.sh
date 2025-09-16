#!/bin/bash

# Kubernetes deployment script for Interview Position Tracker API

set -e

# Configuration
NAMESPACE="interview-tracker"
KUBECTL_CONTEXT="${KUBECTL_CONTEXT:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Set kubectl context if specified
set_context() {
    if [ -n "$KUBECTL_CONTEXT" ]; then
        log_step "Setting kubectl context to: $KUBECTL_CONTEXT"
        kubectl config use-context "$KUBECTL_CONTEXT"
    fi
}

# Deploy to Kubernetes
deploy() {
    log_step "Deploying Interview Position Tracker API to Kubernetes..."
    
    # Create namespace
    log_step "Creating namespace: $NAMESPACE"
    kubectl apply -f k8s/namespace.yaml
    
    # Apply ConfigMap and Secrets
    log_step "Applying configuration..."
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secret.yaml
    
    # Deploy PostgreSQL
    log_step "Deploying PostgreSQL..."
    kubectl apply -f k8s/postgresql.yaml
    
    # Deploy Redis
    log_step "Deploying Redis..."
    kubectl apply -f k8s/redis.yaml
    
    # Wait for database to be ready
    log_step "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgresql -n "$NAMESPACE"
    
    # Run database migration
    log_step "Running database migration..."
    kubectl delete job interview-tracker-migration -n "$NAMESPACE" --ignore-not-found=true
    kubectl apply -f k8s/migration-job.yaml
    kubectl wait --for=condition=complete --timeout=300s job/interview-tracker-migration -n "$NAMESPACE"
    
    # Deploy API
    log_step "Deploying API..."
    kubectl apply -f k8s/api-deployment.yaml
    kubectl apply -f k8s/api-service.yaml
    
    # Deploy HPA
    log_step "Deploying Horizontal Pod Autoscaler..."
    kubectl apply -f k8s/hpa.yaml
    
    # Wait for API deployment to be ready
    log_step "Waiting for API deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/interview-tracker-api -n "$NAMESPACE"
    
    log_info "Deployment completed successfully!"
}

# Show deployment status
show_status() {
    log_step "Deployment Status:"
    echo
    
    echo -e "${BLUE}Pods:${NC}"
    kubectl get pods -n "$NAMESPACE"
    echo
    
    echo -e "${BLUE}Services:${NC}"
    kubectl get services -n "$NAMESPACE"
    echo
    
    echo -e "${BLUE}Ingress:${NC}"
    kubectl get ingress -n "$NAMESPACE"
    echo
    
    echo -e "${BLUE}HPA:${NC}"
    kubectl get hpa -n "$NAMESPACE"
    echo
}

# Show logs
show_logs() {
    log_step "Recent API logs:"
    kubectl logs -l component=api -n "$NAMESPACE" --tail=50
}

# Cleanup function
cleanup() {
    log_warn "Cleaning up deployment..."
    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
    log_info "Cleanup completed"
}

# Main execution
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            set_context
            deploy
            show_status
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Usage: $0 [deploy|status|logs|cleanup]"
            echo "  deploy  - Deploy the application (default)"
            echo "  status  - Show deployment status"
            echo "  logs    - Show recent API logs"
            echo "  cleanup - Remove the deployment"
            exit 1
            ;;
    esac
}

main "$@"