"""
Statistics service for calculating application metrics and conversion rates.
"""
from typing import Dict, List, Optional, Tuple
from uuid import UUID
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract, case
from collections import defaultdict, Counter

from ..models.position import Position, PositionStatus
from ..models.interview import Interview, InterviewType, InterviewOutcome
from ..schemas.statistics import (
    StatisticsOverview,
    TimelineStatistics,
    CompanyStatistics,
    CompanyStatisticsResponse,
    StatisticsFilters
)
from ..schemas.enums import PositionStatus as SchemaPositionStatus
from ..schemas.enums import InterviewType as SchemaInterviewType
from ..schemas.enums import InterviewOutcome as SchemaInterviewOutcome


class StatisticsService:
    """Service for calculating various statistics about job applications and interviews."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_overview_statistics(
        self, 
        user_id: UUID, 
        filters: Optional[StatisticsFilters] = None
    ) -> StatisticsOverview:
        """
        Calculate overview statistics for a user's job applications.
        
        Args:
            user_id: The user ID to calculate statistics for
            filters: Optional filters to apply to the data
            
        Returns:
            StatisticsOverview object with calculated metrics
        """
        # Build base query for positions
        positions_query = self.db.query(Position).filter(Position.user_id == user_id)
        
        # Apply filters if provided
        if filters:
            positions_query = self._apply_position_filters(positions_query, filters)
        
        # Get all positions for the user
        positions = positions_query.all()
        
        # Calculate basic counts
        total_applications = len(positions)
        total_companies = len(set(pos.company for pos in positions))
        
        # Get interviews for these positions
        position_ids = [pos.id for pos in positions]
        interviews_query = self.db.query(Interview).filter(
            Interview.position_id.in_(position_ids)
        ) if position_ids else self.db.query(Interview).filter(False)
        
        interviews = interviews_query.all()
        total_interviews = len(interviews)
        
        # Calculate rates
        response_rate = self._calculate_response_rate(positions)
        interview_rate = self._calculate_interview_rate(positions, interviews)
        offer_rate = self._calculate_offer_rate(positions)
        
        # Calculate breakdowns
        status_breakdown = self._calculate_status_breakdown(positions)
        interview_type_breakdown = self._calculate_interview_type_breakdown(interviews)
        interview_outcome_breakdown = self._calculate_interview_outcome_breakdown(interviews)
        
        return StatisticsOverview(
            total_positions=total_applications,
            total_companies=total_companies,
            total_interviews=total_interviews,
            response_rate=response_rate,
            interview_rate=interview_rate,
            offer_rate=offer_rate,
            positions_by_status=status_breakdown,
            interview_type_breakdown=interview_type_breakdown,
            interview_outcome_breakdown=interview_outcome_breakdown
        )
    
    def get_timeline_statistics(
        self, 
        user_id: UUID, 
        filters: Optional[StatisticsFilters] = None
    ) -> TimelineStatistics:
        """
        Calculate timeline-based statistics for a user's job applications.
        
        Args:
            user_id: The user ID to calculate statistics for
            filters: Optional filters to apply to the data
            
        Returns:
            TimelineStatistics object with time-based metrics
        """
        # Build base query for positions
        positions_query = self.db.query(Position).filter(Position.user_id == user_id)
        
        # Apply filters if provided
        if filters:
            positions_query = self._apply_position_filters(positions_query, filters)
        
        positions = positions_query.all()
        
        # Determine date range
        if filters and filters.start_date and filters.end_date:
            period_start = filters.start_date
            period_end = filters.end_date
        else:
            # Use the range of application dates
            dates = [pos.application_date for pos in positions]
            if dates:
                period_start = min(dates)
                period_end = max(dates)
            else:
                # Default to current month if no data
                today = date.today()
                period_start = today.replace(day=1)
                period_end = today
        
        # Calculate applications per month
        applications_per_month = self._calculate_applications_per_month(positions, period_start, period_end)
        
        # Get interviews for timeline analysis
        position_ids = [pos.id for pos in positions]
        interviews_query = self.db.query(Interview).filter(
            Interview.position_id.in_(position_ids)
        ) if position_ids else self.db.query(Interview).filter(False)
        
        interviews = interviews_query.all()
        
        # Calculate interviews per month
        interviews_per_month = self._calculate_interviews_per_month(interviews, period_start, period_end)
        
        # Calculate average response times
        avg_response_time = self._calculate_average_response_time(positions, interviews)
        avg_interview_to_decision = self._calculate_average_interview_to_decision_time(positions, interviews)
        
        return TimelineStatistics(
            period_start=period_start,
            period_end=period_end,
            applications_per_month=applications_per_month,
            interviews_per_month=interviews_per_month,
            average_response_time_days=avg_response_time,
            average_interview_to_decision_days=avg_interview_to_decision
        )
    
    def get_company_statistics(
        self, 
        user_id: UUID, 
        filters: Optional[StatisticsFilters] = None
    ) -> CompanyStatisticsResponse:
        """
        Calculate company-based statistics for a user's job applications.
        
        Args:
            user_id: The user ID to calculate statistics for
            filters: Optional filters to apply to the data
            
        Returns:
            CompanyStatisticsResponse object with company-based metrics
        """
        # Build base query for positions
        positions_query = self.db.query(Position).filter(Position.user_id == user_id)
        
        # Apply filters if provided
        if filters:
            positions_query = self._apply_position_filters(positions_query, filters)
        
        positions = positions_query.all()
        
        # Group positions by company
        company_positions = defaultdict(list)
        for pos in positions:
            company_positions[pos.company].append(pos)
        
        # Get interviews for all positions
        position_ids = [pos.id for pos in positions]
        interviews_query = self.db.query(Interview).filter(
            Interview.position_id.in_(position_ids)
        ) if position_ids else self.db.query(Interview).filter(False)
        
        interviews = interviews_query.all()
        
        # Group interviews by position
        position_interviews = defaultdict(list)
        for interview in interviews:
            position_interviews[interview.position_id].append(interview)
        
        # Calculate statistics for each company
        company_stats = []
        for company_name, company_pos in company_positions.items():
            # Get interviews for this company's positions
            company_interviews = []
            for pos in company_pos:
                company_interviews.extend(position_interviews.get(pos.id, []))
            
            # Calculate company statistics
            stats = self._calculate_company_statistics(
                company_name, 
                company_pos, 
                company_interviews
            )
            company_stats.append(stats)
        
        # Sort by total applications (descending)
        company_stats.sort(key=lambda x: x.total_applications, reverse=True)
        
        return CompanyStatisticsResponse(
            companies=company_stats,
            total_companies=len(company_stats)
        )
    
    def _apply_position_filters(self, query, filters: StatisticsFilters):
        """Apply filters to a position query."""
        if filters.start_date:
            query = query.filter(Position.application_date >= filters.start_date)
        
        if filters.end_date:
            query = query.filter(Position.application_date <= filters.end_date)
        
        if filters.company:
            query = query.filter(Position.company.ilike(f"%{filters.company}%"))
        
        if filters.status:
            query = query.filter(Position.status == filters.status.value)
        
        return query
    
    def _calculate_response_rate(self, positions: List[Position]) -> float:
        """Calculate the percentage of applications that got responses."""
        if not positions:
            return 0.0
        
        # Consider positions with status other than 'applied' as having received a response
        responses = sum(1 for pos in positions if pos.status != PositionStatus.APPLIED)
        return round((responses / len(positions)) * 100, 2)
    
    def _calculate_interview_rate(self, positions: List[Position], interviews: List[Interview]) -> float:
        """Calculate the percentage of applications that led to interviews."""
        if not positions:
            return 0.0
        
        # Get unique position IDs that have interviews
        positions_with_interviews = set(interview.position_id for interview in interviews)
        return round((len(positions_with_interviews) / len(positions)) * 100, 2)
    
    def _calculate_offer_rate(self, positions: List[Position]) -> float:
        """Calculate the percentage of applications that led to offers."""
        if not positions:
            return 0.0
        
        offers = sum(1 for pos in positions if pos.status == PositionStatus.OFFER)
        return round((offers / len(positions)) * 100, 2)
    
    def _calculate_status_breakdown(self, positions: List[Position]) -> Dict[SchemaPositionStatus, int]:
        """Calculate breakdown of positions by status."""
        status_counts = Counter(pos.status for pos in positions)
        
        # Convert to schema enum and ensure all statuses are represented
        breakdown = {}
        for status in SchemaPositionStatus:
            model_status = PositionStatus(status.value)
            breakdown[status] = status_counts.get(model_status, 0)
        
        return breakdown
    
    def _calculate_interview_type_breakdown(self, interviews: List[Interview]) -> Dict[SchemaInterviewType, int]:
        """Calculate breakdown of interviews by type."""
        type_counts = Counter(interview.type for interview in interviews)
        
        # Convert to schema enum and ensure all types are represented
        breakdown = {}
        for interview_type in SchemaInterviewType:
            model_type = InterviewType(interview_type.value)
            breakdown[interview_type] = type_counts.get(model_type, 0)
        
        return breakdown
    
    def _calculate_interview_outcome_breakdown(self, interviews: List[Interview]) -> Dict[SchemaInterviewOutcome, int]:
        """Calculate breakdown of interviews by outcome."""
        outcome_counts = Counter(interview.outcome for interview in interviews)
        
        # Convert to schema enum and ensure all outcomes are represented
        breakdown = {}
        for outcome in SchemaInterviewOutcome:
            model_outcome = InterviewOutcome(outcome.value)
            breakdown[outcome] = outcome_counts.get(model_outcome, 0)
        
        return breakdown
    
    def _calculate_applications_per_month(
        self, 
        positions: List[Position], 
        start_date: date, 
        end_date: date
    ) -> List[Dict[str, int]]:
        """Calculate applications per month within the date range."""
        monthly_counts = defaultdict(int)
        
        for pos in positions:
            if start_date <= pos.application_date <= end_date:
                month_key = pos.application_date.strftime("%Y-%m")
                monthly_counts[month_key] += 1
        
        # Generate all months in the range
        result = []
        current = start_date.replace(day=1)
        while current <= end_date:
            month_key = current.strftime("%Y-%m")
            result.append({
                "month": month_key,
                "count": monthly_counts.get(month_key, 0)
            })
            
            # Move to next month
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
        
        return result
    
    def _calculate_interviews_per_month(
        self, 
        interviews: List[Interview], 
        start_date: date, 
        end_date: date
    ) -> List[Dict[str, int]]:
        """Calculate interviews per month within the date range."""
        monthly_counts = defaultdict(int)
        
        for interview in interviews:
            interview_date = interview.scheduled_date.date()
            if start_date <= interview_date <= end_date:
                month_key = interview_date.strftime("%Y-%m")
                monthly_counts[month_key] += 1
        
        # Generate all months in the range
        result = []
        current = start_date.replace(day=1)
        while current <= end_date:
            month_key = current.strftime("%Y-%m")
            result.append({
                "month": month_key,
                "count": monthly_counts.get(month_key, 0)
            })
            
            # Move to next month
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
        
        return result
    
    def _calculate_average_response_time(
        self, 
        positions: List[Position], 
        interviews: List[Interview]
    ) -> Optional[float]:
        """Calculate average days from application to first response (interview or status change)."""
        response_times = []
        
        # Group interviews by position
        position_interviews = defaultdict(list)
        for interview in interviews:
            position_interviews[interview.position_id].append(interview)
        
        for pos in positions:
            # Skip positions that are still in 'applied' status with no interviews
            if pos.status == PositionStatus.APPLIED and pos.id not in position_interviews:
                continue
            
            # Find the earliest response date
            earliest_response = None
            
            # Check if there are interviews for this position
            if pos.id in position_interviews:
                earliest_interview = min(
                    position_interviews[pos.id], 
                    key=lambda x: x.scheduled_date
                )
                earliest_response = earliest_interview.scheduled_date.date()
            
            # If we have a response date, calculate the time difference
            if earliest_response:
                days_diff = (earliest_response - pos.application_date).days
                if days_diff >= 0:  # Only count positive response times
                    response_times.append(days_diff)
        
        return round(sum(response_times) / len(response_times), 1) if response_times else None
    
    def _calculate_average_interview_to_decision_time(
        self, 
        positions: List[Position], 
        interviews: List[Interview]
    ) -> Optional[float]:
        """Calculate average days from last interview to final decision."""
        decision_times = []
        
        # Group interviews by position
        position_interviews = defaultdict(list)
        for interview in interviews:
            position_interviews[interview.position_id].append(interview)
        
        for pos in positions:
            # Only consider positions with final status and interviews
            if (pos.status in [PositionStatus.OFFER, PositionStatus.REJECTED] and 
                pos.id in position_interviews):
                
                # Find the latest interview date
                latest_interview = max(
                    position_interviews[pos.id], 
                    key=lambda x: x.scheduled_date
                )
                
                # Use updated_at as the decision date (when status was changed)
                decision_date = pos.updated_at.date()
                interview_date = latest_interview.scheduled_date.date()
                
                days_diff = (decision_date - interview_date).days
                if days_diff >= 0:  # Only count positive decision times
                    decision_times.append(days_diff)
        
        return round(sum(decision_times) / len(decision_times), 1) if decision_times else None
    
    def _calculate_company_statistics(
        self, 
        company_name: str, 
        positions: List[Position], 
        interviews: List[Interview]
    ) -> CompanyStatistics:
        """Calculate statistics for a specific company."""
        total_applications = len(positions)
        total_interviews = len(interviews)
        
        # Find latest application date
        latest_application_date = max(pos.application_date for pos in positions) if positions else None
        
        # Calculate status breakdown
        status_breakdown = self._calculate_status_breakdown(positions)
        
        # Calculate success rate (offers / applications)
        offers = sum(1 for pos in positions if pos.status == PositionStatus.OFFER)
        success_rate = round((offers / total_applications) * 100, 2) if total_applications > 0 else 0.0
        
        return CompanyStatistics(
            company_name=company_name,
            total_applications=total_applications,
            total_interviews=total_interviews,
            latest_application_date=latest_application_date,
            status_breakdown=status_breakdown,
            success_rate=success_rate
        )
    
    def get_success_rates(self, user_id: UUID) -> Dict[str, float]:
        """
        Calculate success rate statistics for a user's job applications.
        
        Args:
            user_id: The user ID to calculate statistics for
            
        Returns:
            Dictionary with success rate metrics
        """
        # Get all positions for the user
        positions = self.db.query(Position).filter(Position.user_id == user_id).all()
        
        if not positions:
            return {
                "application_to_interview_rate": 0.0,
                "interview_to_offer_rate": 0.0,
                "overall_success_rate": 0.0,
                "average_interviews_per_position": 0.0
            }
        
        total_applications = len(positions)
        total_interviews = sum(len(pos.interviews) for pos in positions)
        total_offers = sum(1 for pos in positions if pos.status == PositionStatus.OFFER)
        
        # Calculate rates
        application_to_interview_rate = round((total_interviews / total_applications) * 100, 2) if total_applications > 0 else 0.0
        interview_to_offer_rate = round((total_offers / total_interviews) * 100, 2) if total_interviews > 0 else 0.0
        overall_success_rate = round((total_offers / total_applications) * 100, 2) if total_applications > 0 else 0.0
        average_interviews_per_position = round(total_interviews / total_applications, 2) if total_applications > 0 else 0.0
        
        return {
            "application_to_interview_rate": application_to_interview_rate,
            "interview_to_offer_rate": interview_to_offer_rate,
            "overall_success_rate": overall_success_rate,
            "average_interviews_per_position": average_interviews_per_position
        }
    
    def get_top_companies(self, user_id: UUID, limit: int = 10) -> List[Dict[str, any]]:
        """
        Get top performing companies based on success rates.
        
        Args:
            user_id: The user ID to calculate statistics for
            limit: Number of top companies to return
            
        Returns:
            List of dictionaries with company performance metrics
        """
        # Get all positions for the user
        positions = self.db.query(Position).filter(Position.user_id == user_id).all()
        
        if not positions:
            return []
        
        # Group positions by company
        company_stats = defaultdict(lambda: {
            'applications': 0,
            'interviews': 0,
            'offers': 0
        })
        
        for position in positions:
            company = position.company
            company_stats[company]['applications'] += 1
            company_stats[company]['interviews'] += len(position.interviews)
            if position.status == PositionStatus.OFFER:
                company_stats[company]['offers'] += 1
        
        # Calculate success rates and sort
        top_companies = []
        for company, stats in company_stats.items():
            success_rate = round((stats['offers'] / stats['applications']) * 100, 2) if stats['applications'] > 0 else 0.0
            top_companies.append({
                'company': company,
                'applications': stats['applications'],
                'interviews': stats['interviews'],
                'offers': stats['offers'],
                'success_rate': success_rate
            })
        
        # Sort by success rate (descending) and then by applications (descending)
        top_companies.sort(key=lambda x: (x['success_rate'], x['applications']), reverse=True)
        
        return top_companies[:limit]
    
    def get_monthly_statistics(self, user_id: UUID, year: int) -> List[Dict[str, any]]:
        """
        Get monthly statistics for a specific year.
        
        Args:
            user_id: The user ID to calculate statistics for
            year: The year to get statistics for
            
        Returns:
            List of dictionaries with monthly metrics
        """
        # Get all positions for the user in the specified year
        positions = self.db.query(Position).filter(
            Position.user_id == user_id,
            extract('year', Position.application_date) == year
        ).all()
        
        # Initialize monthly data
        monthly_stats = {}
        for month in range(1, 13):
            monthly_stats[month] = {
                'month': datetime(year, month, 1).strftime('%B'),
                'positions_applied': 0,
                'interviews_conducted': 0,
                'offers_received': 0
            }
        
        # Count positions by month
        for position in positions:
            month = position.application_date.month
            monthly_stats[month]['positions_applied'] += 1
            
            # Count interviews in this month
            for interview in position.interviews:
                if interview.scheduled_date and interview.scheduled_date.year == year:
                    interview_month = interview.scheduled_date.month
                    monthly_stats[interview_month]['interviews_conducted'] += 1
            
            # Count offers in this month
            if position.status == PositionStatus.OFFER and position.updated_at:
                if position.updated_at.year == year:
                    offer_month = position.updated_at.month
                    monthly_stats[offer_month]['offers_received'] += 1
        
        return list(monthly_stats.values())
    
    def get_company_details(self, user_id: UUID, company_name: str) -> Dict[str, any]:
        """
        Get detailed statistics for a specific company including all positions.
        
        Args:
            user_id: The user ID to get company details for
            company_name: The name of the company
            
        Returns:
            Dictionary with company details and positions
        """
        # Get all positions for the user at this company
        positions = self.db.query(Position).filter(
            Position.user_id == user_id,
            Position.company == company_name
        ).all()
        
        if not positions:
            return {
                "company_name": company_name,
                "total_applications": 0,
                "total_interviews": 0,
                "success_rate": 0.0,
                "positions": []
            }
        
        # Calculate statistics
        total_applications = len(positions)
        total_interviews = sum(len(pos.interviews) for pos in positions)
        total_offers = sum(1 for pos in positions if pos.status == PositionStatus.OFFER)
        success_rate = round((total_offers / total_applications) * 100, 2) if total_applications > 0 else 0.0
        
        # Format positions data
        positions_data = []
        for position in positions:
            position_data = {
                "id": str(position.id),
                "title": position.title,
                "company": position.company,
                "location": position.location,
                "status": position.status.value,
                "application_date": position.application_date.isoformat() if position.application_date else None,
                "salary_range": position.salary_range,
                "description": position.description,
                "interviews": []
            }
            
            # Add interview details
            for interview in position.interviews:
                interview_data = {
                    "id": str(interview.id),
                    "type": interview.type.value if interview.type else None,
                    "scheduled_date": interview.scheduled_date.isoformat() if interview.scheduled_date else None,
                    "outcome": interview.outcome.value if interview.outcome else None,
                    "notes": interview.notes
                }
                position_data["interviews"].append(interview_data)
            
            positions_data.append(position_data)
        
        return {
            "company_name": company_name,
            "total_applications": total_applications,
            "total_interviews": total_interviews,
            "success_rate": success_rate,
            "positions": positions_data
        }