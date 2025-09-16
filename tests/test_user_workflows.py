"""
Integration tests covering complete user workflows.
"""
import pytest
from datetime import datetime, date, timedelta
from fastapi import status

from app.schemas.enums import PositionStatus, InterviewType, InterviewPlace, InterviewOutcome


@pytest.mark.integration
class TestCompleteUserWorkflows:
    """Test complete user workflows from registration to statistics."""
    
    def test_complete_job_search_workflow(self, client):
        """Test complete workflow: register -> login -> create position -> add interviews -> view statistics."""
        
        # Step 1: User registration
        registration_data = {
            "email": "jobseeker@example.com",
            "password": "securepassword123",
            "first_name": "Job",
            "last_name": "Seeker"
        }
        
        response = client.post("/api/v1/auth/register", json=registration_data)
        assert response.status_code == status.HTTP_201_CREATED
        user_data = response.json()
        assert user_data["email"] == registration_data["email"]
        assert user_data["first_name"] == registration_data["first_name"]
        
        # Step 2: User login
        login_data = {
            "email": registration_data["email"],
            "password": registration_data["password"]
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == status.HTTP_200_OK
        token_data = response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        
        # Set up authentication headers
        auth_headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        
        # Step 3: Create first position
        position_data = {
            "title": "Senior Software Engineer",
            "company": "TechCorp",
            "description": "Full-stack development with React and Python",
            "location": "San Francisco, CA",
            "salary_range": "$120k - $180k",
            "status": "applied",
            "application_date": str(date.today())
        }
        
        response = client.post("/api/v1/positions", json=position_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        position1 = response.json()
        assert position1["title"] == position_data["title"]
        assert position1["company"] == position_data["company"]
        position1_id = position1["id"]
        
        # Step 4: Create second position
        position2_data = {
            "title": "Frontend Developer",
            "company": "StartupInc",
            "description": "React and TypeScript development",
            "location": "Remote",
            "salary_range": "$90k - $130k",
            "status": "applied",
            "application_date": str(date.today() - timedelta(days=3))
        }
        
        response = client.post("/api/v1/positions", json=position2_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        position2 = response.json()
        position2_id = position2["id"]
        
        # Step 5: Add HR screening interview to first position
        interview1_data = {
            "type": "hr",
            "place": "phone",
            "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 30,
            "notes": "Initial HR screening call",
            "outcome": "pending"
        }
        
        response = client.post(
            f"/api/v1/positions/{position1_id}/interviews",
            json=interview1_data,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        interview1 = response.json()
        assert interview1["type"] == interview1_data["type"]
        interview1_id = interview1["id"]
        
        # Step 6: Update interview outcome to passed
        interview_update = {
            "type": "hr",
            "place": "phone",
            "scheduled_date": interview1_data["scheduled_date"],
            "duration_minutes": 30,
            "notes": "Initial HR screening call - went well",
            "outcome": "passed"
        }
        
        response = client.put(
            f"/api/v1/interviews/{interview1_id}",
            json=interview_update,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        updated_interview = response.json()
        assert updated_interview["outcome"] == "passed"
        
        # Step 7: Update position status to interviewing
        position_update = {
            "title": position_data["title"],
            "company": position_data["company"],
            "description": position_data["description"],
            "location": position_data["location"],
            "salary_range": position_data["salary_range"],
            "status": "interviewing",
            "application_date": position_data["application_date"]
        }
        
        response = client.put(
            f"/api/v1/positions/{position1_id}",
            json=position_update,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        updated_position = response.json()
        assert updated_position["status"] == "interviewing"
        
        # Step 8: Add technical interview
        interview2_data = {
            "type": "technical",
            "place": "video",
            "scheduled_date": (datetime.now() + timedelta(days=5)).isoformat(),
            "duration_minutes": 90,
            "notes": "Technical coding interview",
            "outcome": "pending"
        }
        
        response = client.post(
            f"/api/v1/positions/{position1_id}/interviews",
            json=interview2_data,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        
        # Step 9: View all positions
        response = client.get("/api/v1/positions", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        positions_response = response.json()
        positions = positions_response["positions"]
        assert len(positions) == 2
        assert positions_response["total"] == 2
        
        # Verify positions are returned with interviews
        interviewing_position = next(p for p in positions if p["status"] == "interviewing")
        assert len(interviewing_position["interviews"]) == 2
        
        # Step 10: View statistics
        response = client.get("/api/v1/statistics/overview", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        stats = response.json()
        
        assert stats["total_applications"] == 2
        assert stats["total_interviews"] == 2
        assert stats["response_rate"] > 0
        assert "status_breakdown" in stats
        assert stats["status_breakdown"]["applied"] == 1
        assert stats["status_breakdown"]["interviewing"] == 1
        
        # Step 11: Filter positions by status
        response = client.get("/api/v1/positions?status=interviewing", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        filtered_response = response.json()
        filtered_positions = filtered_response["positions"]
        assert len(filtered_positions) == 1
        assert filtered_positions[0]["status"] == "interviewing"
        
        # Step 12: View company statistics
        response = client.get("/api/v1/statistics/companies", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        company_stats_response = response.json()
        company_stats = company_stats_response["companies"]
        
        assert len(company_stats) == 2
        company_names = [stat["company_name"] for stat in company_stats]
        assert "TechCorp" in company_names
        assert "StartupInc" in company_names
    
    def test_position_lifecycle_workflow(self, client, auth_headers):
        """Test complete position lifecycle from creation to deletion."""
        
        # Create position
        position_data = {
            "title": "DevOps Engineer",
            "company": "CloudTech",
            "description": "AWS and Kubernetes management",
            "location": "Seattle, WA",
            "salary_range": "$110k - $160k",
            "status": "applied",
            "application_date": str(date.today())
        }
        
        response = client.post("/api/v1/positions", json=position_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        position = response.json()
        position_id = position["id"]
        
        # Add multiple interviews
        interviews_data = [
            {
                "type": "hr",
                "place": "phone",
                "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat(),
                "duration_minutes": 30,
                "notes": "HR screening",
                "outcome": "passed"
            },
            {
                "type": "technical",
                "place": "video",
                "scheduled_date": (datetime.now() + timedelta(days=3)).isoformat(),
                "duration_minutes": 60,
                "notes": "Technical round 1",
                "outcome": "passed"
            },
            {
                "type": "technical",
                "place": "onsite",
                "scheduled_date": (datetime.now() + timedelta(days=7)).isoformat(),
                "duration_minutes": 120,
                "notes": "Onsite technical interview",
                "outcome": "pending"
            }
        ]
        
        interview_ids = []
        for interview_data in interviews_data:
            response = client.post(
                f"/api/v1/positions/{position_id}/interviews",
                json=interview_data,
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_201_CREATED
            interview_ids.append(response.json()["id"])
        
        # Update position through different statuses
        statuses = ["screening", "interviewing", "offer"]
        for status_value in statuses:
            position_update = {
                **position_data,
                "status": status_value
            }
            
            response = client.put(
                f"/api/v1/positions/{position_id}",
                json=position_update,
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == status_value
        
        # Verify position with all interviews
        response = client.get(f"/api/v1/positions/{position_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        position_detail = response.json()
        assert len(position_detail["interviews"]) == 3
        assert position_detail["status"] == "offer"
        
        # Delete position (should cascade delete interviews)
        response = client.delete(f"/api/v1/positions/{position_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify position is deleted
        response = client.get(f"/api/v1/positions/{position_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Verify interviews are also deleted
        for interview_id in interview_ids:
            response = client.get(f"/api/v1/interviews/{interview_id}", headers=auth_headers)
            assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_multi_user_data_isolation(self, client):
        """Test that users can only access their own data."""
        
        # Register two users
        user1_data = {
            "email": "user1@example.com",
            "password": "password123",
            "first_name": "User",
            "last_name": "One"
        }
        
        user2_data = {
            "email": "user2@example.com",
            "password": "password123",
            "first_name": "User",
            "last_name": "Two"
        }
        
        # Register users
        response = client.post("/api/v1/auth/register", json=user1_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        response = client.post("/api/v1/auth/register", json=user2_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Login both users
        response = client.post("/api/v1/auth/login", json={
            "email": user1_data["email"],
            "password": user1_data["password"]
        })
        user1_token = response.json()["access_token"]
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        
        response = client.post("/api/v1/auth/login", json={
            "email": user2_data["email"],
            "password": user2_data["password"]
        })
        user2_token = response.json()["access_token"]
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # User 1 creates a position
        position_data = {
            "title": "Software Engineer",
            "company": "TechCorp",
            "description": "Backend development",
            "location": "Remote",
            "salary_range": "$100k - $140k",
            "status": "applied",
            "application_date": str(date.today())
        }
        
        response = client.post("/api/v1/positions", json=position_data, headers=user1_headers)
        assert response.status_code == status.HTTP_201_CREATED
        user1_position = response.json()
        
        # User 2 creates a position
        response = client.post("/api/v1/positions", json=position_data, headers=user2_headers)
        assert response.status_code == status.HTTP_201_CREATED
        user2_position = response.json()
        
        # User 1 should only see their own position
        response = client.get("/api/v1/positions", headers=user1_headers)
        assert response.status_code == status.HTTP_200_OK
        user1_response = response.json()
        user1_positions = user1_response["positions"]
        assert len(user1_positions) == 1
        assert user1_positions[0]["id"] == user1_position["id"]
        
        # User 2 should only see their own position
        response = client.get("/api/v1/positions", headers=user2_headers)
        assert response.status_code == status.HTTP_200_OK
        user2_response = response.json()
        user2_positions = user2_response["positions"]
        assert len(user2_positions) == 1
        assert user2_positions[0]["id"] == user2_position["id"]
        
        # User 1 should not be able to access User 2's position
        response = client.get(f"/api/v1/positions/{user2_position['id']}", headers=user1_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # User 2 should not be able to access User 1's position
        response = client.get(f"/api/v1/positions/{user1_position['id']}", headers=user2_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Statistics should be isolated per user
        response = client.get("/api/v1/statistics/overview", headers=user1_headers)
        assert response.status_code == status.HTTP_200_OK
        user1_stats = response.json()
        assert user1_stats["total_applications"] == 1
        
        response = client.get("/api/v1/statistics/overview", headers=user2_headers)
        assert response.status_code == status.HTTP_200_OK
        user2_stats = response.json()
        assert user2_stats["total_applications"] == 1
    
    def test_error_handling_workflow(self, client, auth_headers):
        """Test error handling throughout user workflows."""
        
        # Test creating position with invalid data
        invalid_position = {
            "title": "",  # Empty title should fail
            "company": "TechCorp",
            "status": "invalid_status",  # Invalid status
            "application_date": "invalid_date"  # Invalid date format
        }
        
        response = client.post("/api/v1/positions", json=invalid_position, headers=auth_headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        error_data = response.json()
        assert "error" in error_data
        assert error_data["error"]["code"] == "VALIDATION_ERROR"
        
        # Test accessing non-existent position
        response = client.get("/api/v1/positions/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Test creating interview for non-existent position
        interview_data = {
            "type": "technical",
            "place": "video",
            "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 60,
            "notes": "Technical interview",
            "outcome": "pending"
        }
        
        response = client.post(
            "/api/v1/positions/00000000-0000-0000-0000-000000000000/interviews",
            json=interview_data,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Test unauthorized access (no auth headers)
        response = client.get("/api/v1/positions")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Test invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/positions", headers=invalid_headers)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED