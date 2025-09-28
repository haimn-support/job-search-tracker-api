#!/usr/bin/env python3
"""
Generate a secure secret key for production deployment.
Run this script to generate a new SECRET_KEY for your environment variables.
"""

import secrets
import string

def generate_secret_key(length=32):
    """Generate a cryptographically secure secret key."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    secret_key = generate_secret_key()
    print(f"Generated SECRET_KEY: {secret_key}")
    print("\nAdd this to your environment variables:")
    print(f"SECRET_KEY={secret_key}")
    print("\n⚠️  Keep this secret key secure and never commit it to version control!")
