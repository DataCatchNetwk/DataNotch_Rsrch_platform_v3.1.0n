# Frontend Integration Notes

## Replace page

Copy:

```text
apps/web/app/dashboard/workspaces/page.tsx
```

into your app.

## Add API client

Copy:

```text
apps/web/src/lib/api/workspace-intake.ts
```

## Environment

Add:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Sidebar

Make sure the Workspaces link points to:

```text
/dashboard/workspaces
```
