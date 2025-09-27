#!/bin/bash

set -euo pipefail

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/nginx/ssl"
mkdir -p "$CERT_DIR"

COUNTRY="US"
STATE="CA"
LOCALITY="San Francisco"
ORG="Interview Tracker Dev"
ORG_UNIT="IT"
COMMON_NAME="localhost"

echo "Generating self-signed TLS certificate for development..."

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -days 365 \
  -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORG/OU=$ORG_UNIT/CN=$COMMON_NAME" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Certificates written to: $CERT_DIR"
ls -l "$CERT_DIR"

echo "Done."


