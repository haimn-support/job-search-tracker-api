#!/bin/bash

# Diagnostic script to check storage issues

set -e

echo "🔍 Diagnosing storage issues..."

# Check if we're connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to a Kubernetes cluster"
    exit 1
fi

echo "📊 Cluster Info:"
kubectl cluster-info

echo ""
echo "🏷️  Available Storage Classes:"
kubectl get storageclass

echo ""
echo "💾 Available Persistent Volumes:"
kubectl get pv

echo ""
echo "📦 PVCs in interview-tracker namespace:"
kubectl get pvc -n interview-tracker

echo ""
echo "🚗 Checking EBS CSI Driver:"
kubectl get pods -n kube-system | grep ebs || echo "EBS CSI Driver not found"

echo ""
echo "🔧 Checking AWS Load Balancer Controller:"
kubectl get pods -n kube-system | grep aws-load-balancer || echo "AWS Load Balancer Controller not found"

echo ""
echo "📋 Events in interview-tracker namespace:"
kubectl get events -n interview-tracker --sort-by='.lastTimestamp' | tail -10

echo ""
echo "🎯 Checking specific PVC events:"
kubectl describe pvc postgresql-pvc -n interview-tracker 2>/dev/null || echo "postgresql-pvc not found"

echo ""
echo "🔍 Node information:"
kubectl get nodes -o wide

echo ""
echo "💡 Recommendations:"
echo "1. If EBS CSI Driver is missing, install it:"
echo "   aws eks create-addon --cluster-name YOUR_CLUSTER --addon-name aws-ebs-csi-driver"
echo ""
echo "2. Try the simple storage approach:"
echo "   kubectl apply -f k8s/simple-postgresql-storage.yaml"
echo ""
echo "3. For local testing, use:"
echo "   kubectl apply -f k8s/local-postgresql-storage.yaml"