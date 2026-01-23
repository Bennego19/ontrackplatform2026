# TODO: OnTrack Connect Platform Fixes

## 🔒 Admin Login API Security & Navigation Fixes (COMPLETED)

### ✅ Backend Security Fixes (adminlogin.mjs)
- [x] Remove password from admin JWT tokens and API response objects
- [x] Add userType: 'admin' to admin JWT payloads in main /adminlogin endpoint
- [x] Add userType: 'student' to student JWT payloads in main /adminlogin endpoint
- [x] Update legacy /adminlogin/adminlogin endpoint for consistency
- [x] Ensure all response objects include proper userType information

### ✅ Frontend Integration Fixes
- [x] Update authMiddleware.js to use smart /api/adminlogin endpoint (auto-detects user type)
- [x] Remove role parameter from login function calls
- [x] Update Login.js to work with smart endpoint

### ✅ Security & Access Control
- [x] Prevent password exposure in JWT tokens and responses
- [x] Ensure login uses only stored database credentials
- [x] Implement proper role-based navigation (admin → /dashboard, student → /userdashboard)
- [x] Prevent cross-login between admin and student roles

### 🧪 Testing Ready
- [ ] Test admin login: username="admin", password="admin123" → /dashboard
- [ ] Test student login: username="student", password="student123" → /userdashboard
- [ ] Verify cross-login prevention
- [ ] Test token verification and persistence

---

## 🌐 URL Redirects for www.ontrackconnect.co.za

### Completed Tasks
- [x] Added redirect middleware in BACKEND/server.mjs to redirect www.ontrackconnect.co.za to https://ontrackconnect.co.za (main website)
- [x] Changed backend port from 3000 to 3001 to resolve permission conflict
- [x] Updated CORS origins to include localhost:3001
- [x] Preserved existing URLs: http://api.ontrackconnect.co.za:3000/ and https://platform.ontrackconnect.co.za/

### Next Steps
- [ ] Test the redirect by accessing http://www.ontrackconnect.co.za/
- [ ] Ensure the backend server is running on port 3001
- [ ] If redirect doesn't work, check DNS configuration for www.ontrackconnect.co.za
- [ ] Verify that API calls to http://api.ontrackconnect.co.za:3000/ still work
- [ ] Verify that frontend at https://platform.ontrackconnect.co.za/ still works
- [ ] Verify that main website at https://ontrackconnect.co.za/ works normally


