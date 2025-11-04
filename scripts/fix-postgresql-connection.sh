#!/bin/bash

# Script to fix PostgreSQL connection issues

set -e

echo "🔧 Fixing PostgreSQL connection issues..."

# Check current status
echo "📊 Current PostgreSQL pods:"
kubectl get pods -n interview-tracker -l app=postgresql

echo ""
echo "🧹 Cleaning up problematic deployments..."

# Delete the problematic deployments but keep the working one for now
kubectl delete deployment postgresql -n interview-tracker --ignore-not-found=true
kubectl delete deployment postgresql-simple -n interview-tracker --ignore-not-found=true

# Delete problematic PVCs
kubectl delete pvc postgresql-pvc -n interview-tracker --ignore-not-found=true
kubectl delete pvc simple-postgresql-pvc -n interview-tracker --ignore-not-found=true

echo ""
echo "🚀 Deploying fixed PostgreSQL..."
kubectl apply -f k8s/postgresql-fixed.yaml

echo ""
echo "⏳ Waiting for PVC to be bound..."
kubectl wait --for=condition=Bound pvc/postgresql-fixed-pvc -n interview-tracker --timeout=60s

echo ""
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=Available deployment/postgresql-fixed -n interview-tracker --timeout=120s

echo ""
echo "✅ Fixed deployment completed!"

echo ""
echo "📊 New status:"
kubectl get pvc,pods,svc -n interview-tracker -l app=postgresql

echo ""
echo "🧪 Testing connection..."
FIXED_POD=$(kubectl get pods -n interview-tracker -l app=postgresql,version=fixed --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$FIXED_POD" ]; then
    echo "Testing database connection..."
    kubectl exec $FIXED_POD -n interview-tracker -- pg_isready -U postgres -h localhost
    
    echo ""
    echo "Testing database query..."
    kubectl exec $FIXED_POD -n interview-tracker -- psql -U postgres -d interview_tracker -c "SELECT 'Connection successful!' as status;"
    
    echo ""
    echo "✅ PostgreSQL is working correctly!"
else
    echo "❌ No running pods found"
fi

echo ""
echo "🔗 Connection info:"
echo "Service: postgresql-fixed"
echo "Port: 5432"
echo "Database: interview_tracker"
echo "Username: postgres"
echo ""
echo "To connect:"
echo "kubectl port-forward -n interview-tracker svc/postgresql-fixed 5432:5432"