#!/bin/bash

# Script to generate proper base64-encoded secrets for Kubernetes

set -e

echo "🔐 Generating secrets for PostgreSQL deployment..."

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Function to base64 encode
b64encode() {
    echo -n "$1" | base64 | tr -d '\n'
}

# Generate passwords if not provided
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(generate_password)}
REDIS_PASSWORD=${REDIS_PASSWORD:-$(generate_password)}
JWT_SECRET=${JWT_SECRET:-$(generate_password)}
SECRET_KEY=${SECRET_KEY:-$(generate_password)}
BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY:-$(generate_password)}

echo "Generated passwords (save these securely!):"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "REDIS_PASSWORD: $REDIS_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"
echo "SECRET_KEY: $SECRET_KEY"
echo "BACKUP_ENCRYPTION_KEY: $BACKUP_ENCRYPTION_KEY"
echo ""

# Create the secrets file
cat > k8s/secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: interview-tracker-secrets
  namespace: interview-tracker
type: Opaque
data:
  # Base64 encoded secrets - generated $(date)
  secret-key: $(b64encode "$SECRET_KEY")
  postgres-password: $(b64encode "$POSTGRES_PASSWORD")
  redis-password: $(b64encode "$REDIS_PASSWORD")
  jwt-secret: $(b64encode "$JWT_SECRET")
  backup-encryption-key: $(b64encode "$BACKUP_ENCRYPTION_KEY")
  # Optional secrets - add your own values here
  sentry-dsn: $(b64encode "")
  analytics-key: $(b64encode "")
  email-service-key: $(b64encode "")
  slack-webhook: $(b64encode "")
  discord-webhook: $(b64encode "")
  stripe-secret-key: $(b64encode "")
  stripe-publishable-key: $(b64encode "")
  google-client-id: $(b64encode "")
  google-client-secret: $(b64encode "")
  github-client-id: $(b64encode "")
  github-client-secret: $(b64encode "")
EOF

echo "✅ Secrets file generated at k8s/secrets.yaml"
echo ""
echo "🔧 To add optional secrets, use:"
echo "echo -n 'your-secret-value' | base64"
echo ""
echo "📝 Remember to update the optional secrets in k8s/secrets.yaml with your actual values"