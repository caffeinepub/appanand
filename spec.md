# Appanand

## Current State
- Multi-user app with registration (up to 10 users) and login via backend canister
- AuthContext handles login/register/logout with backend actor calls
- App.tsx routes unauthenticated users to LoginPage or RegisterPage
- No admin account exists; all users go through the same registration flow

## Requested Changes (Diff)

### Add
- Hardcoded admin account: username `Myappadmin`, password `Myapp@admin`
- Admin login check happens purely in the frontend (no backend call needed for admin)
- AdminPage component: shows app-wide stats (user count, total duty entries, total leave entries, upcoming duties) using existing `getUserCount()`, `getAllDutyEntries()`, `getAllLeaveEntries()`, `getAllUpcomingDuties()` backend methods
- Admin session stored separately from regular user session (e.g. `appanand_admin` localStorage key with a flag)
- Admin logout returns to login screen

### Modify
- AuthContext: add `isAdmin` boolean and `adminLogin(username, password)` method; admin login sets isAdmin flag instead of currentUser
- AuthGate in App.tsx: if isAdmin, render AdminPage; if currentUser, render MainApp; else show Login/Register
- LoginPage: admin credentials are checked on the same login form — no separate UI needed; just treat `Myappadmin`/`Myapp@admin` as special case

### Remove
- Nothing removed

## Implementation Plan
1. Update AuthContext to support admin login (hardcoded check), persist admin session to localStorage, expose `isAdmin` and `adminLogin` and `adminLogout`
2. Create `src/pages/AdminPage.tsx` — shows header with "Admin Dashboard" title, logout button, and stats cards: Registered Users, Total Other Duties, Total Leave Records, Total Upcoming Duties. Use existing backend methods.
3. Update LoginPage to call `adminLogin` when credentials match (or just let the unified `login` method handle it — redirect happens via `isAdmin` flag)
4. Update App.tsx AuthGate to render AdminPage when isAdmin is true
