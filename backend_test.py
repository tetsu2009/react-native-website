#!/usr/bin/env python3
"""
Reality+ Backend Authentication System Tests
Tests all authentication endpoints and database connectivity
"""

import requests
import json
import sys
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get the backend URL from frontend environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

print(f"🔗 Testing Reality+ Backend API at: {API_BASE}")
print("=" * 60)

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

def test_health_endpoints():
    """Test health check endpoints"""
    print(f"\n{Colors.BOLD}1. TESTING HEALTH ENDPOINTS{Colors.ENDC}")
    print("-" * 40)
    
    # Test GET /api/
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print_success(f"GET /api/ - Status: {response.status_code}, Message: {data.get('message')}")
            else:
                print_warning(f"GET /api/ - Unexpected response: {data}")
        else:
            print_error(f"GET /api/ - Status: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"GET /api/ - Connection failed: {str(e)}")
        return False
    
    # Test GET /api/health
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            db_status = data.get("database")
            if db_status == "connected":
                print_success(f"GET /api/health - Database: {db_status}")
            else:
                print_warning(f"GET /api/health - Database issue: {db_status}")
        else:
            print_error(f"GET /api/health - Status: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"GET /api/health - Connection failed: {str(e)}")
        return False
    
    return True

def test_user_registration():
    """Test user registration endpoint"""
    print(f"\n{Colors.BOLD}2. TESTING USER REGISTRATION{Colors.ENDC}")
    print("-" * 40)
    
    # Test data - using realistic data as requested
    test_user = {
        "email": "marie.dubois@reality.com",
        "username": "marie_reality",
        "password": "SecurePass123!",
        "first_name": "Marie",
        "last_name": "Dubois",
        "phone_number": "+33123456789"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            if "access_token" in data and "user" in data:
                user_data = data["user"]
                print_success(f"User registered successfully - ID: {user_data.get('id')}")
                print_info(f"User: {user_data.get('first_name')} {user_data.get('last_name')} ({user_data.get('email')})")
                print_info(f"XP: {user_data.get('xp')}, Level: {user_data.get('level')}, Balance: €{user_data.get('current_balance')}")
                return data["access_token"], test_user
            else:
                print_error(f"Registration response missing required fields: {data}")
                return None, None
        elif response.status_code == 400:
            error_detail = response.json().get("detail", "Unknown error")
            if "already" in error_detail.lower():
                print_warning(f"User already exists: {error_detail}")
                # Try to login instead
                return test_user_login(test_user)
            else:
                print_error(f"Registration failed: {error_detail}")
                return None, None
        else:
            print_error(f"Registration failed - Status: {response.status_code}")
            try:
                print_error(f"Error: {response.json()}")
            except:
                print_error(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print_error(f"Registration request failed: {str(e)}")
        return None, None

def test_user_login(user_credentials):
    """Test user login endpoint"""
    print(f"\n{Colors.BOLD}3. TESTING USER LOGIN{Colors.ENDC}")
    print("-" * 40)
    
    login_data = {
        "email": user_credentials["email"],
        "password": user_credentials["password"]
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                user_data = data["user"]
                print_success(f"Login successful - Welcome back {user_data.get('first_name')}!")
                print_info(f"Last activity: {user_data.get('last_activity')}")
                return data["access_token"]
            else:
                print_error(f"Login response missing required fields: {data}")
                return None
        elif response.status_code == 401:
            error_detail = response.json().get("detail", "Unauthorized")
            print_error(f"Login failed: {error_detail}")
            return None
        else:
            print_error(f"Login failed - Status: {response.status_code}")
            try:
                print_error(f"Error: {response.json()}")
            except:
                print_error(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Login request failed: {str(e)}")
        return None

def test_protected_profile(access_token):
    """Test protected profile endpoint"""
    print(f"\n{Colors.BOLD}4. TESTING PROTECTED PROFILE ACCESS{Colors.ENDC}")
    print("-" * 40)
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{API_BASE}/auth/me",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            user_data = response.json()
            print_success("Profile retrieved successfully")
            print_info(f"User ID: {user_data.get('id')}")
            print_info(f"Name: {user_data.get('first_name')} {user_data.get('last_name')}")
            print_info(f"Email: {user_data.get('email')}")
            print_info(f"Username: {user_data.get('username')}")
            print_info(f"XP: {user_data.get('xp')}, Level: {user_data.get('level')}")
            print_info(f"Missions completed: {user_data.get('missions_completed')}")
            print_info(f"Current balance: €{user_data.get('current_balance')}")
            return True
        elif response.status_code == 401:
            print_error("Unauthorized - Invalid or expired token")
            return False
        else:
            print_error(f"Profile access failed - Status: {response.status_code}")
            try:
                print_error(f"Error: {response.json()}")
            except:
                print_error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Profile request failed: {str(e)}")
        return False

def test_profile_update(access_token):
    """Test profile update endpoint"""
    print(f"\n{Colors.BOLD}5. TESTING PROFILE UPDATE{Colors.ENDC}")
    print("-" * 40)
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Update data
    update_data = {
        "first_name": "Marie-Claire",
        "phone_number": "+33987654321"
    }
    
    try:
        response = requests.put(
            f"{API_BASE}/auth/profile",
            json=update_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            user_data = response.json()
            print_success("Profile updated successfully")
            print_info(f"Updated name: {user_data.get('first_name')} {user_data.get('last_name')}")
            print_info(f"Updated phone: {user_data.get('phone_number')}")
            print_info(f"Updated at: {user_data.get('updated_at')}")
            return True
        elif response.status_code == 401:
            print_error("Unauthorized - Invalid or expired token")
            return False
        else:
            print_error(f"Profile update failed - Status: {response.status_code}")
            try:
                print_error(f"Error: {response.json()}")
            except:
                print_error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Profile update request failed: {str(e)}")
        return False

def test_error_cases():
    """Test error handling scenarios"""
    print(f"\n{Colors.BOLD}6. TESTING ERROR CASES{Colors.ENDC}")
    print("-" * 40)
    
    # Test duplicate email registration
    print_info("Testing duplicate email registration...")
    duplicate_user = {
        "email": "marie.dubois@reality.com",  # Same email as before
        "username": "different_username",
        "password": "AnotherPass123!",
        "first_name": "Different",
        "last_name": "User"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/register",
            json=duplicate_user,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 400:
            error_detail = response.json().get("detail", "")
            if "already" in error_detail.lower():
                print_success("Duplicate email properly rejected")
            else:
                print_warning(f"Unexpected error message: {error_detail}")
        else:
            print_warning(f"Expected 400 error, got: {response.status_code}")
    except Exception as e:
        print_error(f"Duplicate email test failed: {str(e)}")
    
    # Test invalid login credentials
    print_info("Testing invalid login credentials...")
    invalid_login = {
        "email": "marie.dubois@reality.com",
        "password": "WrongPassword123!"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json=invalid_login,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 401:
            print_success("Invalid credentials properly rejected")
        else:
            print_warning(f"Expected 401 error, got: {response.status_code}")
    except Exception as e:
        print_error(f"Invalid login test failed: {str(e)}")
    
    # Test protected endpoint without token
    print_info("Testing protected endpoint without token...")
    try:
        response = requests.get(f"{API_BASE}/auth/me", timeout=10)
        if response.status_code == 401 or response.status_code == 403:
            print_success("Protected endpoint properly secured")
        else:
            print_warning(f"Expected 401/403 error, got: {response.status_code}")
    except Exception as e:
        print_error(f"Protected endpoint test failed: {str(e)}")

def main():
    """Run all backend tests"""
    print(f"{Colors.BOLD}🚀 REALITY+ BACKEND AUTHENTICATION TESTS{Colors.ENDC}")
    print(f"Testing at: {API_BASE}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    test_results = {
        "health_check": False,
        "user_registration": False,
        "user_login": False,
        "protected_profile": False,
        "profile_update": False,
        "error_handling": True  # Assume true, will be set false if major issues
    }
    
    # 1. Test health endpoints
    test_results["health_check"] = test_health_endpoints()
    
    if not test_results["health_check"]:
        print_error("Health check failed - stopping tests")
        return False
    
    # 2. Test user registration
    access_token, user_credentials = test_user_registration()
    if access_token and user_credentials:
        test_results["user_registration"] = True
    
    # 3. Test user login (if registration failed, try with existing user)
    if not access_token and user_credentials:
        access_token = test_user_login(user_credentials)
    
    if access_token:
        test_results["user_login"] = True
        
        # 4. Test protected profile access
        test_results["protected_profile"] = test_protected_profile(access_token)
        
        # 5. Test profile update
        test_results["profile_update"] = test_profile_update(access_token)
    
    # 6. Test error cases
    test_error_cases()
    
    # Print final results
    print(f"\n{Colors.BOLD}📊 TEST RESULTS SUMMARY{Colors.ENDC}")
    print("=" * 60)
    
    total_tests = len([k for k in test_results.keys() if k != "error_handling"])
    passed_tests = len([k for k, v in test_results.items() if v and k != "error_handling"])
    
    for test_name, result in test_results.items():
        if test_name == "error_handling":
            continue
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\n{Colors.BOLD}Overall: {passed_tests}/{total_tests} tests passed{Colors.ENDC}")
    
    if passed_tests == total_tests:
        print_success("🎉 All authentication tests passed!")
        return True
    else:
        print_error(f"❌ {total_tests - passed_tests} test(s) failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)