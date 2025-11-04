#!/bin/bash

# PostgreSQL AWS EKS Deployment Script
# This script ensures proper PV/PVC setup for PostgreSQL on AWS

set -e

echo "🚀 Deploying PostgreSQL on AWS EKS with proper PV/PVC..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if we're connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to a Kubernetes cluster"
    exit 1
fi

# Create namespace if it doesn't exist
echo "📁 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Install EBS CSI Driver (if not already installed)
echo "💾 Checking EBS CSI Driver..."
if ! kubectl get storageclass ebs-csi &> /dev/null; then
    echo "Installing EBS CSI Driver..."
    # You need to install this via Helm or EKS add-on
    echo "⚠️  Please ensure EBS CSI Driver is installed on your EKS cluster"
    echo "   Run: aws eks create-addon --cluster-name YOUR_CLUSTER --addon-name aws-ebs-csi-driver"
fi

# Check if secrets exist, if not generate them
echo "🔐 Checking secrets..."
if ! kubectl get secret interview-tracker-secrets -n interview-tracker &> /dev/null; then
    echo "Generating new secrets..."
    ./scripts/generate-secrets.sh
fi

echo "🔐 Applying secrets..."
kubectl apply -f k8s/secrets.yaml

# Apply storage class
echo "💿 Creating storage class..."
kubectl apply -f k8s/storage-class.yaml

# Apply the complete PostgreSQL deployment
echo "🐘 Deploying PostgreSQL..."
kubectl apply -f k8s/postgresql-aws-deployment.yaml

# Wait for PVC to be bound
echo "⏳ Waiting for PVC to be bound..."
kubectl wait --for=condition=Bound pvc/postgresql-pvc -n interview-tracker --timeout=300s

# Wait for deployment to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=Available deployment/postgresql -n interview-tracker --timeout=300s

# Show status
echo "✅ PostgreSQL deployment completed!"
echo ""
echo "📊 Status:"
kubectl get pvc,pv,pods -n interview-tracker -l app=postgresql

echo ""
echo "🔍 To check logs:"
echo "kubectl logs -n interview-tracker -l app=postgresql"

echo ""
echo "🔗 To connect to PostgreSQL:"
echo "kubectl port-forward -n interview-tracker svc/postgresql 5432:5432"