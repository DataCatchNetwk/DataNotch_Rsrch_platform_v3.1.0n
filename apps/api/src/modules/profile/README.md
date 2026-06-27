# Profile Module

Express adaptation of the provided profile wiring package.

Routes:

- GET /api/profile
- PATCH /api/profile
- GET /api/profile/stats
- GET /api/profile/security
- GET /api/profile/workspaces
- GET /api/profile/activity
- GET /api/profile/notifications
- PATCH /api/profile/notifications
- GET /api/v1/profile
- PATCH /api/v1/profile
- GET /api/v1/profile/stats
- GET /api/v1/profile/security
- GET /api/v1/profile/workspaces
- GET /api/v1/profile/activity
- GET /api/v1/profile/notifications
- PATCH /api/v1/profile/notifications

Implementation notes:

- Core counts and activity are Prisma-backed.
- Profile metadata and notification preferences persist on the User record.
- Session and trusted-device metrics are derived from recent login audit history.
