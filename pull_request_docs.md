# Git Commit Message

**Title:**
`feat(security): migrate to httponly cookies and harden global data validation`

**Description:**
```text
- Migrated authentication tokens from localStorage to secure, httpOnly cookies to prevent XSS attacks.
- Updated `authController`, `authRoutes`, and `authMiddleware` to issue, read, and clear session cookies dynamically based on user roles.
- Configured frontend Axios interceptors with `withCredentials: true` and removed manual header injection.
- Refactored frontend `utils/auth.js` and `ProtectedRoute.jsx` to rely on asynchronous logout endpoints and user metadata instead of client-side tokens.
- Integrated `express-mongo-sanitize` globally in `app.js` (with a custom wrapper for Express 5 compatibility) to prevent NoSQL injection.
- Added strict MongoDB ObjectID validation across routes using `router.param`.
- Finalized backend hard-delete functionality and active/inactive state handling for Table Management operations.
```

---

# Pull Request Title
**Security Overhaul: HttpOnly Session Cookies, NoSQL Sanitization, and Validation Hardening**

# Pull Request Description

## 🎯 Objective
This PR implements a comprehensive security and architectural overhaul of the Guest-O application. The primary focus is transitioning to a more secure session management model by migrating JWT storage from the client to `httpOnly` cookies, alongside global backend data sanitization.

## 🛠️ Changes Made

### 1. 🛡️ Authentication & Session Security (XSS Mitigation)
- **Backend:** 
  - Installed and configured `cookie-parser`.
  - Refactored `authController.js` to issue JWTs into secure `httpOnly` cookies (`token`, `admin_token`, `staff_token`) rather than passing them in the JSON body.
  - Implemented a dedicated `POST /api/auth/logout` endpoint to securely destroy cookies.
  - Updated `authMiddleware.js` to extract tokens directly from `req.cookies`.
- **Frontend:** 
  - Enabled `withCredentials: true` in `axiosInstance.js` to automatically send cookies with cross-origin requests.
  - Removed all instances of `localStorage.setItem('token')` from login components (`LoginPage`, `AdminLogin`, `StaffLogin`).
  - Refactored `utils/auth.js` to asynchronously hit the backend logout endpoint before clearing non-sensitive user metadata.
  - Updated `ProtectedRoute.jsx` to verify local authentication state using user payloads rather than token strings.

### 2. 🧱 Backend Data Validation & Sanitization (Injection Prevention)
- **Global NoSQL Sanitization:** Integrated `express-mongo-sanitize` globally in `app.js`. Implemented a custom wrapper to bypass Express 5's read-only getter restrictions on request objects, preventing server crashes while safely stripping `$` and `.` characters from incoming data.
- **ObjectID Validation:** Enforced strict MongoDB ObjectID validation across all major routes (Users, Orders, Tables) using Express `router.param` middleware. This centralized validation prevents unhandled database cast errors.

### 3. 📋 Table Management & Operational Logic
- Transitioned Table Management from soft-deletes to physical database hard-deletes (`tableController`, `tableSchema`) to streamline the data lifecycle.
- Refined active/inactive status toggle states and improved real-time table syncing for staff workflows.
- Stabilized Admin Order Management rendering logic to prevent flickering and excessive data fetching.

## 🧪 How to Test
1. Attempt to log in via the User, Admin, or Staff portals. Verify that authentication succeeds and that the token is stored in the browser's Cookies tab (DevTools -> Application -> Cookies), *not* in Local Storage.
2. Navigate through protected routes (Admin Dashboard, Waiter Dashboard, Profile) to ensure cookies are being automatically attached to Axios requests.
3. Log out and verify you are redirected appropriately and that the cookie is destroyed from the browser.
4. (Backend Test) Attempt to inject a MongoDB operator (e.g., `{"$gt": ""}`) into any form field; verify that the sanitization middleware intercepts and neutralizes the payload without crashing the Express 5 server.

## ⚠️ Breaking Changes
- Mobile applications or external clients consuming this API *must* now support cookie-based sessions, as the `Authorization: Bearer <token>` header pattern has been deprecated in favor of `httpOnly` cookies.
