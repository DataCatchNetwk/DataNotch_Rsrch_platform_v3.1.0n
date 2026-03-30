# Research Platform Notifications Pack

Production-oriented starter pack for a **real notifications system** aligned with your research platform features:

- Prisma models for notifications and delivery logs
- NestJS notifications module
- REST endpoints for inbox, unread counts, mark-as-read, bulk actions
- WebSocket gateway for live updates
- Next.js + shadcn/ui notifications page
- notification bell dropdown for the top nav
- typed frontend API client

## Feature Fit

This pack is designed for a research/data platform with:

- dataset processing alerts
- workspace invitations
- collaborator actions
- reviewer decisions
- analysis job progress/completion/failure
- report generation events
- admin announcements
- mentions and comments

## Suggested route placement

- Frontend page: `/notifications`
- Bell component: place in dashboard header/topbar
- Backend base: `/notifications`
- Gateway namespace: `notifications`

## Backend endpoints

- `GET /notifications?cursor=&limit=&status=&category=`
- `GET /notifications/unread-count`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `PATCH /notifications/archive-all-read`
- `PATCH /notifications/preferences`
- `DELETE /notifications/:id`

## Realtime events

Gateway emits:

- `notification.created`
- `notification.read`
- `notification.deleted`
- `notification.unread_count`

## Integration points

You should publish notification events from these modules in your platform:

- datasets
- workspaces
- collaborators
- requests/reviewer queue
- analysis jobs / pipelines
- reports
- billing / approvals
- system announcements

## Notes

- Replace auth decorator/guard imports with your project versions if paths differ.
- Wire `CurrentUser()` to your JWT/session payload.
- If you already use SSE instead of WebSockets, the service and controller logic can stay mostly the same.
