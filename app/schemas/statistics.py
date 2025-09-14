"""
Pydantic schemas for statistics-related operations.
"""
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, Dict, List, Union, Any
from .enums import PositionStatus, InterviewType, InterviewOutcome


class StatisticsOverview(BaseModel):
    """Schema for general statistics overview."""
    total_applications: int = Field(..., description="Total number of applications")
    total_companies: int = Field(..., description="Total number of unique companies")
    total_interviews: int = Field(..., description="Total number of interviews")
    response_rate: float = Field(..., description="Percentage of applications that got responses")
    interview_rate: float = Field(..., description="Percentage of applications that led to interviews")
    offer_rate: float = Field(..., description="Percentage of applications that led to offers")
    
    status_breakdown: Dict[PositionStatus, int] = Field(..., description="Count by position status")
    interview_type_breakdown: Dict[InterviewType, int] = Field(..., description="Count by interview type")
    interview_outcome_breakdown: Dict[InterviewOutcome, int] = Field(..., description="Count by interview outcome")


class TimelineStatistics(BaseModel):
    """Schema for time-based statistics."""
    period_start: date = Field(..., description="Start date of the period")
    period_end: date = Field(..., description="End date of the period")
    applications_per_month: List[Dict[str, Union[str, int]]] = Field(..., description="Applications count per month")
    interviews_per_month: List[Dict[str, Union[str, int]]] = Field(..., description="Interviews count per month")
    average_response_time_days: Optional[float] = Field(None, description="Average days to get response")
    average_interview_to_decision_days: Optional[float] = Field(None, description="Average days from interview to decision")


class CompanyStatistics(BaseModel):
    """Schema for company-based statistics."""
    company_name: str = Field(..., description="Company name")
    total_applications: int = Field(..., description="Total applications to this company")
    total_interviews: int = Field(..., description="Total interviews with this company")
    latest_application_date: Optional[date] = Field(None, description="Most recent application date")
    status_breakdown: Dict[PositionStatus, int] = Field(..., description="Status breakdown for this company")
    success_rate: float = Field(..., description="Success rate (offers/applications)")


class CompanyStatisticsResponse(BaseModel):
    """Schema for company statistics response."""
    companies: List[CompanyStatistics] = Field(..., description="Statistics per company")
    total_companies: int = Field(..., description="Total number of companies")


class StatisticsFilters(BaseModel):
    """Schema for statistics filtering parameters."""
    start_date: Optional[date] = Field(None, description="Filter start date")
    end_date: Optional[date] = Field(None, description="Filter end date")
    company: Optional[str] = Field(None, description="Filter by company name")
    status: Optional[PositionStatus] = Field(None, description="Filter by position status")