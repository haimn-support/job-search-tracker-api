#!/bin/bash

# Secrets Management Script for Interview Position Tracker
# This script helps manage secrets across different environments

set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SECRETS_DIR="$PROJECT_ROOT/secrets"
ENVIRONMENTS=("development" "staging" "production")

# Function to display usage
usage() {
    echo "Usage: $0 {generate|validate|rotate|backup|restore} [environment]"
    echo ""
    echo "Commands:"
    echo "  generate  - Generate new secrets for specified environment"
    echo "  validate  - Validate secrets for specified environment"
    echo "  rotate    - Rotate secrets for specified environment"
    echo "  backup    - Backup secrets for specified environment"
    echo "  restore   - Restore secrets for specified environment"
    echo ""
    echo "Environments: development, staging, production"
    echo ""
    echo "Examples:"
    echo "  $0 generate production"
    echo "  $0 validate staging"
    echo "  $0 rotate production"
    exit 1
}

# Function to generate random secret
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate secrets for environment
generate_secrets() {
    local env=$1
    local secrets_file="$SECRETS_DIR/$env.secrets"
    
    echo -e "${YELLOW}Generating secrets for $env environment...${NC}"
    
    # Create secrets directory if it doesn't exist
    mkdir -p "$SECRETS_DIR"
    
    # Generate secrets
    cat > "$secrets_file" << EOF
# Secrets for $env environment
# Generated on $(date)

# Database Configuration
POSTGRES_PASSWORD=$(generate_secret 24)

# Security Configuration
SECRET_KEY=$(generate_secret 64)
JWT_SECRET=$(generate_secret 32)

# Redis Configuration
REDIS_PASSWORD=$(generate_secret 24)

# External Services
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
ANALYTICS_KEY=$(generate_secret 32)
EMAIL_SERVICE_KEY=$(generate_secret 32)

# API Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Social Auth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=$(generate_secret 32)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=$(generate_secret 32)

# Monitoring
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/slack/webhook
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/discord/webhook

# Backup and Recovery
BACKUP_ENCRYPTION_KEY=$(generate_secret 32)
EOF

    # Set proper permissions
    chmod 600 "$secrets_file"
    
    echo -e "${GREEN}Secrets generated successfully for $env environment${NC}"
    echo -e "${YELLOW}Secrets file: $secrets_file${NC}"
    echo -e "${RED}IMPORTANT: Keep this file secure and never commit it to version control!${NC}"
}

# Function to validate secrets
validate_secrets() {
    local env=$1
    local secrets_file="$SECRETS_DIR/$env.secrets"
    
    echo -e "${YELLOW}Validating secrets for $env environment...${NC}"
    
    if [ ! -f "$secrets_file" ]; then
        echo -e "${RED}Error: Secrets file not found: $secrets_file${NC}"
        return 1
    fi
    
    # Check if secrets file has proper permissions
    local perms=$(stat -c "%a" "$secrets_file")
    if [ "$perms" != "600" ]; then
        echo -e "${RED}Warning: Secrets file has incorrect permissions ($perms). Should be 600.${NC}"
    fi
    
    # Validate required secrets
    local required_secrets=("POSTGRES_PASSWORD" "SECRET_KEY" "JWT_SECRET")
    local missing_secrets=()
    
    for secret in "${required_secrets[@]}"; do
        if ! grep -q "^$secret=" "$secrets_file"; then
            missing_secrets+=("$secret")
        fi
    done
    
    if [ ${#missing_secrets[@]} -eq 0 ]; then
        echo -e "${GREEN}All required secrets are present${NC}"
    else
        echo -e "${RED}Missing required secrets: ${missing_secrets[*]}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Secrets validation completed successfully${NC}"
}

# Function to rotate secrets
rotate_secrets() {
    local env=$1
    local secrets_file="$SECRETS_DIR/$env.secrets"
    
    echo -e "${YELLOW}Rotating secrets for $env environment...${NC}"
    
    if [ ! -f "$secrets_file" ]; then
        echo -e "${RED}Error: Secrets file not found: $secrets_file${NC}"
        return 1
    fi
    
    # Create backup
    local backup_file="$secrets_file.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$secrets_file" "$backup_file"
    echo -e "${GREEN}Backup created: $backup_file${NC}"
    
    # Rotate secrets that should be rotated
    local secrets_to_rotate=("POSTGRES_PASSWORD" "SECRET_KEY" "JWT_SECRET" "REDIS_PASSWORD")
    
    for secret in "${secrets_to_rotate[@]}"; do
        if grep -q "^$secret=" "$secrets_file"; then
            local new_value=$(generate_secret)
            sed -i "s/^$secret=.*/$secret=$new_value/" "$secrets_file"
            echo -e "${GREEN}Rotated $secret${NC}"
        fi
    done
    
    echo -e "${GREEN}Secrets rotation completed successfully${NC}"
    echo -e "${YELLOW}Remember to update your deployment with the new secrets!${NC}"
}

# Function to backup secrets
backup_secrets() {
    local env=$1
    local secrets_file="$SECRETS_DIR/$env.secrets"
    local backup_dir="$SECRETS_DIR/backups"
    
    echo -e "${YELLOW}Backing up secrets for $env environment...${NC}"
    
    if [ ! -f "$secrets_file" ]; then
        echo -e "${RED}Error: Secrets file not found: $secrets_file${NC}"
        return 1
    fi
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Create encrypted backup
    local backup_file="$backup_dir/$env.secrets.$(date +%Y%m%d_%H%M%S).enc"
    gpg --symmetric --cipher-algo AES256 --output "$backup_file" "$secrets_file"
    
    echo -e "${GREEN}Encrypted backup created: $backup_file${NC}"
    echo -e "${YELLOW}Remember to store the backup securely!${NC}"
}

# Function to restore secrets
restore_secrets() {
    local env=$1
    local backup_file=$2
    local secrets_file="$SECRETS_DIR/$env.secrets"
    
    echo -e "${YELLOW}Restoring secrets for $env environment...${NC}"
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}Error: Backup file not specified${NC}"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}Error: Backup file not found: $backup_file${NC}"
        return 1
    fi
    
    # Create secrets directory
    mkdir -p "$SECRETS_DIR"
    
    # Decrypt and restore
    gpg --decrypt --output "$secrets_file" "$backup_file"
    chmod 600 "$secrets_file"
    
    echo -e "${GREEN}Secrets restored successfully${NC}"
}

# Function to list available environments
list_environments() {
    echo -e "${YELLOW}Available environments:${NC}"
    for env in "${ENVIRONMENTS[@]}"; do
        local secrets_file="$SECRETS_DIR/$env.secrets"
        if [ -f "$secrets_file" ]; then
            echo -e "  ${GREEN}✓${NC} $env (secrets file exists)"
        else
            echo -e "  ${RED}✗${NC} $env (no secrets file)"
        fi
    done
}

# Main script logic
main() {
    local command=$1
    local environment=$2
    
    # Check if command is provided
    if [ -z "$command" ]; then
        usage
    fi
    
    # Handle commands that don't require environment
    case $command in
        "list")
            list_environments
            exit 0
            ;;
        "help"|"-h"|"--help")
            usage
            ;;
    esac
    
    # Check if environment is provided
    if [ -z "$environment" ]; then
        echo -e "${RED}Error: Environment not specified${NC}"
        usage
    fi
    
    # Validate environment
    local valid_env=false
    for env in "${ENVIRONMENTS[@]}"; do
        if [ "$environment" = "$env" ]; then
            valid_env=true
            break
        fi
    done
    
    if [ "$valid_env" = false ]; then
        echo -e "${RED}Error: Invalid environment '$environment'${NC}"
        echo -e "${YELLOW}Valid environments: ${ENVIRONMENTS[*]}${NC}"
        exit 1
    fi
    
    # Execute command
    case $command in
        "generate")
            generate_secrets "$environment"
            ;;
        "validate")
            validate_secrets "$environment"
            ;;
        "rotate")
            rotate_secrets "$environment"
            ;;
        "backup")
            backup_secrets "$environment"
            ;;
        "restore")
            restore_secrets "$environment" "$3"
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$command'${NC}"
            usage
            ;;
    esac
}

# Run main function with all arguments
main "$@"
