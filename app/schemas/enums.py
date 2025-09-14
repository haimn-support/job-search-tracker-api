"""
Enum classes for the interview position tracker API.
"""
from enum import Enum


class PositionStatus(str, Enum):
    """Status of a job position application."""
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class InterviewType(str, Enum):
    """Type of interview based on its purpose."""
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    HR = "hr"
    FINAL = "final"


class InterviewPlace(str, Enum):
    """Format/location where the interview takes place."""
    PHONE = "phone"
    VIDEO = "video"
    ONSITE = "onsite"


class InterviewOutcome(str, Enum):
    """Outcome of an interview."""
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    CANCELLED = "cancelled"