#!/bin/bash

# Verification script for current PostgreSQL deployment

set -e

echo "🔍 Verifying Current PostgreSQL Deployment..."

# Check namespace
echo "📁 Namespace Status:"
kubectl get namespace interview-tracker

echo ""
echo "💾 Storage Resources:"
kubectl get storageclass | grep -E "(NAME|local-storage|simple-ebs|postgresql-ebs)"

echo ""
echo "📦 PVC Status:"
kubectl get pvc -n interview-tracker

echo ""
echo "💿 PV Status:"
kubectl get pv | grep -E "(NAME|local-postgresql|simple-postgresql|postgresql)"

echo ""
echo "🐘 PostgreSQL Pods:"
kubectl get pods -n interview-tracker -l app=postgresql

echo ""
echo "🔗 PostgreSQL Service:"
kubectl get svc -n interview-tracker -l app=postgresql

echo ""
echo "🔐 Secrets:"
kubectl get secret interview-tracker-secrets -n interview-tracker

echo ""
echo "📊 Working Deployment Details:"
WORKING_POD=$(kubectl get pods -n interview-tracker -l app=postgresql --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$WORKING_POD" ]; then
    echo "✅ Found running PostgreSQL pod: $WORKING_POD"
    
    echo ""
    echo "🔍 Pod Details:"
    kubectl describe pod $WORKING_POD -n interview-tracker
    
    echo ""
    echo "📋 Recent Logs:"
    kubectl logs $WORKING_POD -n interview-tracker --tail=10
    
    echo ""
    echo "🧪 Testing Database Connection:"
    kubectl exec $WORKING_POD -n interview-tracker -- pg_isready -U postgres || echo "Connection test failed"
    
    echo ""
    echo "🗄️  Database Info:"
    kubectl exec $WORKING_POD -n interview-tracker -- psql -U postgres -d interview_tracker -c "SELECT version();" || echo "Database query failed"
    
else
    echo "❌ No running PostgreSQL pods found"
    echo ""
    echo "🔍 Checking pod events:"
    kubectl get events -n interview-tracker --field-selector involvedObject.kind=Pod --sort-by='.lastTimestamp' | tail -5
fi

echo ""
echo "🎯 Connection Instructions:"
echo "To connect to PostgreSQL from outside the cluster:"
echo "kubectl port-forward -n interview-tracker svc/postgresql 5432:5432"
echo ""
echo "Then connect with:"
echo "psql -h localhost -p 5432 -U postgres -d interview_tracker"
echo ""
echo "Password is stored in the secret (base64 encoded):"
echo "kubectl get secret interview-tracker-secrets -n interview-tracker -o jsonpath='{.data.postgres-password}' | base64 -d"