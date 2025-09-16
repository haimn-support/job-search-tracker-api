feat: implement comprehensive error handling system

## Summary
Added a robust, standardized error handling system across the entire API with custom exceptions, global handlers, and user-friendly error responses.

## Key Features Added

### Custom Exception Classes (`app/core/exceptions.py`)
- BaseAPIException: Foundation for all API exceptions with consistent structure
- ValidationException: Field-specific validation errors with detailed feedback
- ResourceNotFoundException: 404 errors with resource context and IDs
- AuthenticationException: 401 authentication failures with security-conscious messages
- AuthorizationException: 403 authorization errors
- ConflictException: 409 resource conflicts (duplicate emails, etc.)
- DatabaseException: 500 database operation failures
- BusinessLogicException: Domain-specific validation errors
- ExternalServiceException: 503 third-party service failures
- RateLimitException: 429 rate limiting with retry-after headers

### Global Exception Handlers (`app/core/exception_handlers.py`)
- Standardized JSON error response format with error codes, messages, and timestamps
- Request validation handler with user-friendly field-specific error messages
- SQLAlchemy exception handler for database errors with appropriate HTTP status codes
- Generic exception handler for unhandled exceptions with safe error responses
- Security-conscious error messages that prevent information leakage

### Updated API Integration
- Authentication service: Uses ConflictException, AuthenticationException, DatabaseException
- Dependencies: Updated with AuthenticationException and ResourceNotFoundException
- Positions API: Integrated ResourceNotFoundException and DatabaseException
- Interviews API: Added ownership verification helper and comprehensive error handling
- Main application: Registered all exception handlers globally

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "timestamp": "2024-01-01T12:00:00Z",
    "details": { "context": "info" },
    "field_errors": { "field": "error message" }
  }
}
```

### Comprehensive Test Suite (`tests/test_error_handling.py`)
- Custom exception class tests
- Error response format validation
- Global exception handler integration tests
- Edge case handling (invalid JSON, large requests, invalid UUIDs)
- User-friendly error message verification
- Security testing for information leakage prevention

## Benefits
- **Consistent User Experience**: Standardized error responses across all endpoints
- **Developer Friendly**: Clear error codes and messages for easy debugging
- **Security**: Prevents sensitive information leakage through error messages
- **Maintainable**: Centralized error handling reduces code duplication
- **Robust**: Handles edge cases and unexpected errors gracefully
- **Well Tested**: Comprehensive test coverage for all error scenarios

## Requirements Satisfied
- 1.3: Validation error handling for position creation
- 2.2: Validation error handling for position updates
- 4.2: Error handling for position deletion
- 7.3: Authentication and authorization error handling

## Documentation
- Updated README.md with comprehensive error handling documentation
- Added error response format examples
- Included field validation examples
- Documented security features and HTTP status codes

This implementation provides a production-ready error handling system that enhances both user experience and API reliability while maintaining security best practices.