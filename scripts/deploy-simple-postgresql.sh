#!/bin/bash

# Simple PostgreSQL deployment script with basic storage

set -e

echo "🚀 Deploying PostgreSQL with simple storage..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Create namespace if it doesn't exist
echo "📁 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply secrets
echo "🔐 Applying secrets..."
kubectl apply -f k8s/secrets.yaml

# Clean up any existing postgresql resources
echo "🧹 Cleaning up existing resources..."
kubectl delete deployment postgresql -n interview-tracker --ignore-not-found=true
kubectl delete deployment postgresql-simple -n interview-tracker --ignore-not-found=true
kubectl delete pvc postgresql-pvc -n interview-tracker --ignore-not-found=true
kubectl delete pvc simple-postgresql-pvc -n interview-tracker --ignore-not-found=true

# Wait a moment for cleanup
sleep 5

# Deploy simple PostgreSQL
echo "🐘 Deploying PostgreSQL with simple storage..."
kubectl apply -f k8s/simple-postgresql-storage.yaml

# Wait for PVC to be bound (shorter timeout)
echo "⏳ Waiting for PVC to be bound (60s timeout)..."
if kubectl wait --for=condition=Bound pvc/simple-postgresql-pvc -n interview-tracker --timeout=60s; then
    echo "✅ PVC bound successfully!"
else
    echo "⚠️  PVC binding timed out, checking status..."
    kubectl describe pvc simple-postgresql-pvc -n interview-tracker
    echo ""
    echo "🔄 Trying local storage approach..."
    kubectl apply -f k8s/local-postgresql-storage.yaml
    
    echo "⏳ Waiting for local PVC..."
    kubectl wait --for=condition=Bound pvc/local-postgresql-pvc -n interview-tracker --timeout=30s || true
fi

# Wait for deployment to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=Available deployment/postgresql-simple -n interview-tracker --timeout=120s || \
kubectl wait --for=condition=Available deployment/postgresql-local -n interview-tracker --timeout=120s || true

# Show status
echo "✅ Deployment completed!"
echo ""
echo "📊 Status:"
kubectl get pvc,pods,svc -n interview-tracker -l app=postgresql

echo ""
echo "🔍 To check logs:"
echo "kubectl logs -n interview-tracker -l app=postgresql"

echo ""
echo "🔗 To connect to PostgreSQL:"
echo "kubectl port-forward -n interview-tracker svc/postgresql 5432:5432"