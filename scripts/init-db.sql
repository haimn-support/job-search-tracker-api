-- Database initialization script for Docker
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable, but kept for reference)

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create a read-only user for monitoring/reporting (optional)
-- CREATE USER interview_tracker_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE interview_tracker TO interview_tracker_readonly;
-- GRANT USAGE ON SCHEMA public TO interview_tracker_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO interview_tracker_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO interview_tracker_readonly;