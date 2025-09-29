"""
Statistics API endpoints for job application analytics.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from ..core.dependencies import get_db, get_current_user
from ..models.user import User
from ..services.statistics_service import StatisticsService
from ..schemas.statistics import (
    StatisticsOverview,
    TimelineStatistics,
    CompanyStatisticsResponse,
    StatisticsFilters
)
from ..schemas.enums import PositionStatus

router = APIRouter(prefix="/statistics", tags=["Statistics"])


@router.get("/dashboard", response_model=StatisticsOverview)
async def get_dashboard_statistics(
    start_date: Optional[date] = Query(None, description="Filter start date"),
    end_date: Optional[date] = Query(None, description="Filter end date"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    status: Optional[PositionStatus] = Query(None, description="Filter by position status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics for the current user's job applications.
    
    This endpoint provides comprehensive metrics for the dashboard including:
    - Total applications, companies, and interviews
    - Response rate, interview rate, and offer rate
    - Breakdowns by status, interview type, and interview outcome
    
    This is an alias for the overview endpoint for frontend compatibility.
    """
    # Create filters object if any filters are provided
    filters = None
    if any([start_date, end_date, company, status]):
        filters = StatisticsFilters(
            start_date=start_date,
            end_date=end_date,
            company=company,
            status=status
        )
    
    statistics_service = StatisticsService(db)
    return statistics_service.get_overview_statistics(current_user.id, filters)


@router.get("/overview", response_model=StatisticsOverview)
async def get_overview_statistics(
    start_date: Optional[date] = Query(None, description="Filter start date"),
    end_date: Optional[date] = Query(None, description="Filter end date"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    status: Optional[PositionStatus] = Query(None, description="Filter by position status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get overview statistics for the current user's job applications.
    
    This endpoint provides comprehensive metrics including:
    - Total applications, companies, and interviews
    - Response rate, interview rate, and offer rate
    - Breakdowns by status, interview type, and interview outcome
    
    Optional filters can be applied to focus on specific time periods,
    companies, or application statuses.
    """
    # Create filters object if any filters are provided
    filters = None
    if any([start_date, end_date, company, status]):
        filters = StatisticsFilters(
            start_date=start_date,
            end_date=end_date,
            company=company,
            status=status
        )
    
    statistics_service = StatisticsService(db)
    return statistics_service.get_overview_statistics(current_user.id, filters)


@router.get("/timeline", response_model=TimelineStatistics)
async def get_timeline_statistics(
    start_date: Optional[date] = Query(None, description="Filter start date"),
    end_date: Optional[date] = Query(None, description="Filter end date"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    status: Optional[PositionStatus] = Query(None, description="Filter by position status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get timeline-based statistics for the current user's job applications.
    
    This endpoint provides time-based metrics including:
    - Applications and interviews per month
    - Average response time from application to first interview
    - Average time from interview to final decision
    
    If no date range is specified, the endpoint will use the full range
    of the user's application dates.
    """
    # Create filters object if any filters are provided
    filters = None
    if any([start_date, end_date, company, status]):
        filters = StatisticsFilters(
            start_date=start_date,
            end_date=end_date,
            company=company,
            status=status
        )
    
    statistics_service = StatisticsService(db)
    return statistics_service.get_timeline_statistics(current_user.id, filters)


@router.get("/companies", response_model=CompanyStatisticsResponse)
async def get_company_statistics(
    start_date: Optional[date] = Query(None, description="Filter start date"),
    end_date: Optional[date] = Query(None, description="Filter end date"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    status: Optional[PositionStatus] = Query(None, description="Filter by position status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get company-based statistics for the current user's job applications.
    
    This endpoint provides per-company metrics including:
    - Total applications and interviews per company
    - Latest application date for each company
    - Status breakdown for each company
    - Success rate (offers/applications) for each company
    
    Companies are sorted by total applications in descending order.
    """
    # Create filters object if any filters are provided
    filters = None
    if any([start_date, end_date, company, status]):
        filters = StatisticsFilters(
            start_date=start_date,
            end_date=end_date,
            company=company,
            status=status
        )
    
    statistics_service = StatisticsService(db)
    return statistics_service.get_company_statistics(current_user.id, filters)


@router.get("/success-rates")
async def get_success_rates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get success rate statistics for the current user's job applications.
    
    This endpoint provides success rate metrics including:
    - Application to interview rate
    - Interview to offer rate
    - Overall success rate
    - Average interviews per position
    """
    statistics_service = StatisticsService(db)
    return statistics_service.get_success_rates(current_user.id)


@router.get("/top-companies")
async def get_top_companies(
    limit: int = Query(10, description="Number of top companies to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get top performing companies based on success rates.
    
    This endpoint provides company performance metrics including:
    - Company name
    - Total applications
    - Total interviews
    - Total offers
    - Success rate
    """
    statistics_service = StatisticsService(db)
    return statistics_service.get_top_companies(current_user.id, limit)


@router.get("/monthly/{year}")
async def get_monthly_statistics(
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get monthly statistics for a specific year.
    
    This endpoint provides monthly metrics including:
    - Positions applied per month
    - Interviews conducted per month
    - Offers received per month
    """
    statistics_service = StatisticsService(db)
    return statistics_service.get_monthly_statistics(current_user.id, year)