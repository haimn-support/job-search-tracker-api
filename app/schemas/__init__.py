"""
Pydantic schemas for the interview position tracker API.
"""

# Enums
from .enums import (
    PositionStatus,
    InterviewType,
    InterviewPlace,
    InterviewOutcome
)

# User schemas
from .user import (
    UserBase,
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse
)

# Position schemas
from .position import (
    PositionBase,
    PositionCreate,
    PositionUpdate,
    PositionResponse,
    PositionListResponse
)

# Interview schemas
from .interview import (
    InterviewBase,
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    InterviewListResponse
)

# Statistics schemas
from .statistics import (
    StatisticsOverview,
    TimelineStatistics,
    CompanyStatistics,
    CompanyStatisticsResponse,
    StatisticsFilters
)

# Common schemas
from .common import (
    ErrorDetail,
    ValidationErrorDetail,
    ValidationErrorResponse,
    PaginationParams,
    FilterParams,
    SuccessResponse,
    HealthCheckResponse,
    DatabaseInfo,
    DetailedHealthCheckResponse,
    DatabaseHealthCheckResponse
)

__all__ = [
    # Enums
    "PositionStatus",
    "InterviewType", 
    "InterviewPlace",
    "InterviewOutcome",
    
    # User schemas
    "UserBase",
    "UserCreate",
    "UserLogin", 
    "UserResponse",
    "TokenResponse",
    
    # Position schemas
    "PositionBase",
    "PositionCreate",
    "PositionUpdate",
    "PositionResponse",
    "PositionListResponse",
    
    # Interview schemas
    "InterviewBase",
    "InterviewCreate",
    "InterviewUpdate", 
    "InterviewResponse",
    "InterviewListResponse",
    
    # Statistics schemas
    "StatisticsOverview",
    "TimelineStatistics",
    "CompanyStatistics",
    "CompanyStatisticsResponse",
    "StatisticsFilters",
    
    # Common schemas
    "ErrorDetail",
    "ValidationErrorDetail",
    "ValidationErrorResponse",
    "PaginationParams",
    "FilterParams",
    "SuccessResponse",
    "HealthCheckResponse",
    "DatabaseInfo",
    "DetailedHealthCheckResponse",
    "DatabaseHealthCheckResponse"
]