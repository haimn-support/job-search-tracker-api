#!/bin/bash

# Fix API secrets for proper PostgreSQL connection

set -e

echo "🔧 Fixing API secrets for PostgreSQL connection..."

# Get current password
POSTGRES_PASSWORD=$(kubectl get secret interview-tracker-secrets -n interview-tracker -o jsonpath='{.data.postgres-password}' | base64 -d)
SECRET_KEY=$(kubectl get secret interview-tracker-secrets -n interview-tracker -o jsonpath='{.data.secret-key}' | base64 -d)

echo "Current PostgreSQL password: $POSTGRES_PASSWORD"

# Create DATABASE_URL
DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgresql-final:5432/interview_tracker"

echo "Database URL: $DATABASE_URL"

# Update secrets with missing values
kubectl patch secret interview-tracker-secrets -n interview-tracker --type='merge' -p="{
  \"data\": {
    \"DATABASE_URL\": \"$(echo -n "$DATABASE_URL" | base64 | tr -d '\n')\",
    \"SECRET_KEY\": \"$(echo -n "$SECRET_KEY" | base64 | tr -d '\n')\"
  }
}"

echo "✅ Secrets updated successfully!"

echo ""
echo "📊 Updated secret keys:"
kubectl get secret interview-tracker-secrets -n interview-tracker -o jsonpath='{.data}' | jq -r 'keys[]'

echo ""
echo "🔗 Your API can now connect to PostgreSQL using:"
echo "Service: postgresql-final"
echo "Database: interview_tracker"
echo "Username: postgres"
echo "Password: $POSTGRES_PASSWORD"

echo ""
echo "🚀 You can now deploy your API with:"
echo "kubectl apply -f k8s/api-deployment.yaml"