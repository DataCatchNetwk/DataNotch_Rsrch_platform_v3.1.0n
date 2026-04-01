# Fully Wired Upgrade Notes

## What this pack adds

### Frontend
- Search input
- Domain multi-filter
- Accessibility filter
- Favorites toggle
- Table view
- Card grid view
- Preview modal with first rows + metadata
- Pull-to-workspace action modal
- Empty/loading/error states

### Backend
- Deposit catalog list and detail endpoints
- Preview endpoint that creates/reads queue-backed preview jobs
- Pull endpoint that enqueues workspace import jobs
- Example RBAC guards for `deposit.view`, `deposit.preview`, `deposit.pull`
- Queue service for BullMQ-style job submission

## Recommended permissions
- `deposit.view`
- `deposit.preview`
- `deposit.pull`
- `deposit.favorite`
- `deposit.admin`

## Recommended queue names
- `dataset-preview`
- `dataset-pull`
- `dataset-ingestion`

## Suggested next upgrade
- real Prisma migration files
- Redis/BullMQ registration
- warehouse adapters for preview sampling
- signed URLs / secure temporary data access
- lineage persistence and preview caching
