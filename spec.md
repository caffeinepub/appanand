# Appanand

## Current State
- User registration capped at 10 users (`users.size() >= 10` in backend)
- Admin dashboard shows 4 stat cards (user count, duty records, leave records, upcoming duties)
- No backend function to retrieve the full user list
- Admin page has no user list table

## Requested Changes (Diff)

### Add
- `getAllUsers()` query function in Motoko backend returning all User records
- `getAllUsers()` to backend.d.ts interface
- User list table in AdminPage: columns = Name, Last Entry Date (computed from all duty/leave/upcoming entry createdAt across all users)

### Modify
- Registration limit: change `>= 10` to `>= 100` in `registerUser`
- AdminPage: replace the 4 stat cards with a clean user list table showing Name and Last Entry Date; keep header and logout

### Remove
- 4 stat cards (userCount, dutyCount, leaveCount, upcomingCount) from AdminPage
- "Admin access is read-only" info card

## Implementation Plan
1. Edit `main.mo`: change limit to 100, add `getAllUsers()` query
2. Edit `backend.d.ts`: add `getAllUsers()` to interface
3. Rewrite `AdminPage.tsx`: show user list table with Name + Last Entry Date (derived from max createdAt across all three entry types per userId)
