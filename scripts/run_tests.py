#!/usr/bin/env python3
"""
Comprehensive test runner script for the Interview Position Tracker API.
"""
import subprocess
import sys
import os
from pathlib import Path


def run_command(command, description):
    """Run a command and handle the output."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    
    if result.stdout:
        print("STDOUT:")
        print(result.stdout)
    
    if result.stderr:
        print("STDERR:")
        print(result.stderr)
    
    if result.returncode != 0:
        print(f"❌ {description} failed with exit code {result.returncode}")
        return False
    else:
        print(f"✅ {description} completed successfully")
        return True


def main():
    """Run comprehensive test suite."""
    print("🚀 Starting comprehensive test suite for Interview Position Tracker API")
    
    # Change to project root directory
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    
    # Test commands to run
    test_commands = [
        {
            "command": "python -m pytest tests/ -v --tb=short",
            "description": "All Tests"
        },
        {
            "command": "python -m pytest tests/ -m unit -v",
            "description": "Unit Tests Only"
        },
        {
            "command": "python -m pytest tests/ -m integration -v",
            "description": "Integration Tests Only"
        },
        {
            "command": "python -m pytest tests/test_user_workflows.py -v",
            "description": "User Workflow Tests"
        },
        {
            "command": "python -m pytest tests/ --cov=app --cov-report=term-missing --cov-report=html",
            "description": "Tests with Coverage Report"
        }
    ]
    
    # Run tests
    results = []
    for test_config in test_commands:
        success = run_command(test_config["command"], test_config["description"])
        results.append((test_config["description"], success))
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    
    all_passed = True
    for description, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {description}")
        if not success:
            all_passed = False
    
    if all_passed:
        print(f"\n🎉 All tests passed successfully!")
        print(f"📊 Coverage report generated in htmlcov/index.html")
    else:
        print(f"\n💥 Some tests failed. Please check the output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()