#!/bin/bash

# PostgreSQL PV/PVC Verification Script for AWS EKS

set -e

echo "🔍 Verifying PostgreSQL PV/PVC setup on AWS EKS..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check namespace
echo "📁 Checking namespace..."
if kubectl get namespace interview-tracker &> /dev/null; then
    echo "✅ Namespace 'interview-tracker' exists"
else
    echo "❌ Namespace 'interview-tracker' not found"
    exit 1
fi

# Check storage class
echo "💿 Checking storage class..."
if kubectl get storageclass postgresql-ebs-sc &> /dev/null; then
    echo "✅ Storage class 'postgresql-ebs-sc' exists"
    kubectl describe storageclass postgresql-ebs-sc
else
    echo "❌ Storage class 'postgresql-ebs-sc' not found"
fi

# Check PVC
echo ""
echo "📦 Checking PVC..."
if kubectl get pvc postgresql-pvc -n interview-tracker &> /dev/null; then
    echo "✅ PVC 'postgresql-pvc' exists"
    kubectl describe pvc postgresql-pvc -n interview-tracker
else
    echo "❌ PVC 'postgresql-pvc' not found"
fi

# Check PV
echo ""
echo "💾 Checking PV..."
PV_NAME=$(kubectl get pvc postgresql-pvc -n interview-tracker -o jsonpath='{.spec.volumeName}' 2>/dev/null || echo "")
if [ -n "$PV_NAME" ]; then
    echo "✅ PV '$PV_NAME' is bound to PVC"
    kubectl describe pv "$PV_NAME"
else
    echo "❌ No PV bound to PVC"
fi

# Check PostgreSQL deployment
echo ""
echo "🐘 Checking PostgreSQL deployment..."
if kubectl get deployment postgresql -n interview-tracker &> /dev/null; then
    echo "✅ PostgreSQL deployment exists"
    kubectl get pods -n interview-tracker -l app=postgresql
else
    echo "❌ PostgreSQL deployment not found"
fi

# Check service
echo ""
echo "🔗 Checking PostgreSQL service..."
if kubectl get service postgresql -n interview-tracker &> /dev/null; then
    echo "✅ PostgreSQL service exists"
    kubectl describe service postgresql -n interview-tracker
else
    echo "❌ PostgreSQL service not found"
fi

# Check EBS CSI Driver
echo ""
echo "🚗 Checking EBS CSI Driver..."
if kubectl get pods -n kube-system -l app=ebs-csi-controller &> /dev/null; then
    echo "✅ EBS CSI Driver is running"
else
    echo "⚠️  EBS CSI Driver may not be installed"
    echo "   Install it with: aws eks create-addon --cluster-name YOUR_CLUSTER --addon-name aws-ebs-csi-driver"
fi

echo ""
echo "🎯 Summary:"
echo "- Storage Class: $(kubectl get storageclass postgresql-ebs-sc -o name 2>/dev/null || echo 'Not found')"
echo "- PVC Status: $(kubectl get pvc postgresql-pvc -n interview-tracker -o jsonpath='{.status.phase}' 2>/dev/null || echo 'Not found')"
echo "- PV Status: $(kubectl get pv "$PV_NAME" -o jsonpath='{.status.phase}' 2>/dev/null || echo 'Not found')"
echo "- PostgreSQL Status: $(kubectl get deployment postgresql -n interview-tracker -o jsonpath='{.status.conditions[?(@.type=="Available")].status}' 2>/dev/null || echo 'Not found')"