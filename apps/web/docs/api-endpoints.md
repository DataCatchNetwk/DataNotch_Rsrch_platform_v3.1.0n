# API Endpoints

## Auth

- `POST /api/v1/auth/register-request`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/complete-2fa?token=...`
- `POST /api/v1/auth/complete-2fa`

## Admin

- `GET /api/v1/admin/registration-requests`
- `PATCH /api/v1/admin/registration-requests/:id/review`

## Users

- `GET /api/v1/users/:userId/dashboard`

Returns dashboard stats, activity chart points, recent activity, and latest health-data rows for the authenticated user.

## Datasets

- `POST /api/v1/datasets/upload-intake`

## Projects

- `GET /api/v1/projects/health`

## Reports

- `GET /api/v1/reports/health`
