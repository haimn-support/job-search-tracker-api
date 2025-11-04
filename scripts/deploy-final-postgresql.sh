#!/bin/bash

# Deploy final PostgreSQL without connection issues

set -e

echo "🚀 Deploying final PostgreSQL without authentication issues..."

# Clean up previous deployments but keep the working PVC
echo "🧹 Cleaning up previous deployments..."
kubectl delete deployment postgresql-local -n interview-tracker --ignore-not-found=true
kubectl delete deployment postgresql-fixed -n interview-tracker --ignore-not-found=true
kubectl delete service postgresql-fixed -n interview-tracker --ignore-not-found=true

# Deploy the final version
echo "🐘 Deploying final PostgreSQL..."
kubectl apply -f k8s/postgresql-final.yaml

echo ""
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=Available deployment/postgresql-final -n interview-tracker --timeout=120s

echo ""
echo "✅ Final deployment completed!"

echo ""
echo "📊 Status:"
kubectl get pods,svc -n interview-tracker -l app=postgresql

echo ""
echo "🧪 Testing connection..."
FINAL_POD=$(kubectl get pods -n interview-tracker -l app=postgresql,version=final --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$FINAL_POD" ]; then
    echo "Waiting for PostgreSQL to be fully ready..."
    sleep 10
    
    echo "Testing database connection..."
    kubectl exec $FINAL_POD -n interview-tracker -- psql -U postgres -d interview_tracker -c "SELECT version();"
    
    echo ""
    echo "✅ PostgreSQL is working without authentication errors!"
    
    echo ""
    echo "📋 Checking recent logs (should be clean)..."
    kubectl logs $FINAL_POD -n interview-tracker --tail=5
else
    echo "❌ No running pods found"
fi

echo ""
echo "🔗 Connection info:"
echo "Service: postgresql-final"
echo "Port: 5432"
echo "Database: interview_tracker"
echo "Username: postgres"
echo ""
echo "To connect from outside:"
echo "kubectl port-forward -n interview-tracker svc/postgresql-final 5432:5432"
echo ""
echo "Password:"
kubectl get secret interview-tracker-secrets -n interview-tracker -o jsonpath='{.data.postgres-password}' | base64 -d
echo ""