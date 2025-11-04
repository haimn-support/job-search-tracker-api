#!/bin/bash

# Quick fix script for secrets and PostgreSQL deployment

set -e

echo "🔧 Fixing secrets and deploying PostgreSQL..."

# Delete existing secret if it has invalid data
echo "🗑️  Cleaning up invalid secrets..."
kubectl delete secret interview-tracker-secrets -n interview-tracker --ignore-not-found=true

# Generate new valid secrets
echo "🔐 Generating new secrets..."
./scripts/generate-secrets.sh

# Apply the corrected secrets
echo "✅ Applying corrected secrets..."
kubectl apply -f k8s/secrets.yaml

# Deploy PostgreSQL with proper PV/PVC
echo "🐘 Deploying PostgreSQL..."
kubectl apply -f k8s/postgresql-aws-deployment.yaml

# Wait for PVC to be bound
echo "⏳ Waiting for PVC to be bound..."
kubectl wait --for=condition=Bound pvc/postgresql-pvc -n interview-tracker --timeout=300s

# Wait for deployment to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=Available deployment/postgresql -n interview-tracker --timeout=300s

echo "✅ PostgreSQL deployment completed successfully!"
echo ""
echo "📊 Current status:"
kubectl get pvc,pv,pods,svc -n interview-tracker -l app=postgresql

echo ""
echo "🔍 To verify everything is working:"
echo "./scripts/verify-postgresql-pv.sh"