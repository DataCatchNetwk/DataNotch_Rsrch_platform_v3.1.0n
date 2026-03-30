# Analysis Jobs Page — Final shadcn UI Button / Action Spec

## Purpose
This specification defines the final production-ready shadcn UI action model for the Analysis Jobs page in the Research Platform user area.

This spec excludes the sidebar and focuses on:
- page-level actions
- search and filter controls
- table row actions
- bulk actions
- state-specific button behavior
- empty, loading, error, and completed states
- recommended shadcn UI components
- implementation guidance for Next.js + shadcn/ui

## 1. Page Goal
The Analysis Jobs page should let users:
1. start a new analysis
2. monitor analysis progress
3. inspect job details
4. recover failed jobs
5. open results and reports
6. download outputs and logs

Expected workflow:
Upload Dataset -> Create Analysis -> Monitor Job -> View Results -> Download Outputs / Reports

## 2. Page Header Actions
Header layout:

Left:
- Page title: Analysis Jobs
- Subtitle: Track queued, running, and completed analysis tasks.

Right:
- New Analysis
  - Variant: default
  - Icon: Plus
  - Purpose: opens analysis creation flow or modal
  - Priority: primary CTA

- Run Pipeline
  - Variant: secondary
  - Icon: Workflow
  - Purpose: launch a saved reusable pipeline

- Upload Dataset
  - Variant: outline
  - Icon: Upload
  - Purpose: route user to dataset upload or attach dataset flow

- Refresh
  - Variant: ghost
  - Icon: RefreshCw
  - Purpose: reload job list and statuses

Optional advanced actions:
- Import Config
  - Variant: outline
  - Icon: FileUp
  - Purpose: import prior job configuration JSON

- Saved Templates
  - Variant: outline
  - Icon: BookCopy
  - Purpose: start from saved templates

## 3. Stats Card Actions
A row of clickable stat cards should appear below the header.

Cards:
- Total Jobs
- Queued
- Running
- Succeeded
- Failed
- Avg Runtime

Behavior:
- each card acts as a quick filter button
- active card uses stronger border/background
- clicking a card updates table filter state
- Failed should visually emphasize attention

Recommended shadcn components:
- Card
- CardHeader
- CardContent
- Badge

## 4. Search + Filter Action Bar
Required controls:
- Search Jobs
  - Component: Input
  - Placeholder: Search jobs
  - Searches by job name, dataset name, workspace, job id, pipeline name

- Status Filter
  - Component: Select
  - Options: ALL, QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED

- Workspace Filter
  - Component: Select

- Dataset Filter
  - Component: Select or searchable combobox

- Date Range
  - Component: Popover + date picker

- Sort By
  - Component: Select
  - Options: Newest, Oldest, Runtime, Status, Last Updated

Supporting buttons:
- Clear Filters
  - Variant: ghost

- Advanced Filters
  - Variant: outline
  - Opens sheet or drawer with extended controls

- Export Metadata
  - Variant: outline
  - Exports current filtered list to CSV or JSON

## 5. Jobs Table Actions
Recommended columns:
- Job Name
- Dataset
- Workspace
- Analysis Type
- Status
- Submitted At
- Last Updated
- Runtime
- Owner
- Actions

Each row should include:
- View Details
- Open Results
- Download Output
- Download Logs
- Retry Job
- Duplicate Job
- Cancel Job
- Delete or Archive
- Share
- Report Issue

Recommended shadcn components:
- Table
- DropdownMenu
- Button
- Badge
- Tooltip

## 6. Bulk Actions
When one or more rows are selected, show a bulk action bar above the table.

Bulk buttons:
- Retry Selected
- Download Selected
- Export Metadata
- Archive Selected
- Delete Selected
- Cancel Selected

Rules:
- disable actions that do not apply to selected states
- show selection count
- allow clear selection action

Recommended shadcn components:
- Checkbox
- Button
- AlertDialog

## 7. Job Details Sheet or Modal
Selecting View Details should open a right-side sheet.

Tabs or sections:
- Overview
- Parameters
- Input Files
- Logs
- Results
- Artifacts
- Execution Timeline

Footer actions:
- Retry Job
- Cancel Job
- Open Results
- Download Report
- Download Full Package
- Close

Recommended components:
- Sheet
- Tabs
- ScrollArea
- Badge
- Separator

## 8. Status-Specific Button Rules
QUEUED:
- enable: View Details, Cancel Job
- disable or hide: Open Results, Download Output, Retry Job

RUNNING:
- enable: View Details, View Live Logs, Cancel Job
- disable or hide: Open Results, Download Output, Retry Job

SUCCEEDED:
- enable: View Details, Open Results, Download Output, Download Report, Download Logs, Duplicate Job, Share
- disable or hide: Cancel Job, Retry Job

FAILED:
- enable: View Details, View Error, Download Logs, Retry Job, Duplicate Job, Report Issue
- disable or hide: Open Results, Download Output unless partial artifacts exist

CANCELLED:
- enable: View Details, Retry Job, Duplicate Job, Download Logs
- disable or hide: Cancel Job, Open Results

## 9. Empty State Spec
When the user has no analysis jobs:

Title:
- No analysis jobs yet

Description:
- Start your first analysis by uploading a dataset or launching a pipeline.

Actions:
- Start First Analysis
- Upload Dataset
- Browse Templates

Optional visual:
- FlaskConical or Sparkles illustration

Recommended components:
- Card
- Button
- Separator

## 10. Loading State Spec
When jobs are loading:
- show skeleton cards for stats
- show skeleton search/filter bar
- show 6 to 8 skeleton table rows

Recommended components:
- Skeleton

Behavior:
- header buttons remain visible
- table row actions hidden until data loads
- Refresh may spin or be temporarily disabled

## 11. Error State Spec
Replace plain red text with a full error container.

Title:
- Unable to load analysis jobs

Description:
- We couldn't retrieve your jobs right now. Please refresh or try again in a moment.

Actions:
- Retry
- Refresh Page
- Contact Support (optional)
- View System Status (optional)

Recommended components:
- Alert
- Button
- Card

UX note:
Use destructive styling only for the accent, not the whole page.

## 12. Results-Ready Success State
For completed jobs, prioritize:
- Open Results
- Download Output
- Download Report
- Share
- Duplicate Job

## 13. Recommended Button Variants
Primary:
- New Analysis
- Retry in urgent failed context
- Start First Analysis

Secondary or outline:
- Run Pipeline
- Open Results
- Download Report

Ghost:
- Refresh
- Clear Filters
- View Logs

Destructive:
- Cancel Job
- Delete Job
- Delete Selected

## 14. Suggested Icon Mapping
- New Analysis -> Plus
- Run Pipeline -> Workflow
- Upload Dataset -> Upload
- Refresh -> RefreshCw
- Search -> Search
- Filter -> SlidersHorizontal
- Open Results -> BarChart3
- Reports -> FileText
- Download Output -> Download
- Download Logs -> ScrollText
- Retry Job -> RotateCcw
- Cancel Job -> Square
- Delete -> Trash2
- Share -> Share2
- Details -> PanelRightOpen
- Error -> AlertTriangle
- Success -> CheckCircle2
- Running -> Loader2
- Queued -> Clock3

## 15. Accessibility and UX Rules
- every icon-only button must have a tooltip
- destructive actions must confirm via AlertDialog
- row actions should be keyboard accessible
- status badges should not rely on color alone
- long-running actions should show spinner or pending state
- downloads should clearly indicate file type when known
- disabled buttons should explain why when possible

## 16. Final Button Priority Matrix
Must-have:
- New Analysis
- Run Pipeline
- Upload Dataset
- Refresh
- View Details
- Open Results
- Download Output
- Download Logs
- Retry Job
- Cancel Job

Strongly recommended:
- Clear Filters
- Advanced Filters
- Duplicate Job
- Export Metadata
- Download Report
- Share

Nice to have:
- Import Config
- Saved Templates
- Report Issue
- Contact Support
- View System Status

## 17. Final Page Composition
Recommended order:
1. Header
2. Primary actions
3. Stats cards
4. Search and filter bar
5. Jobs table
6. Bulk actions
7. Details sheet
8. Empty, loading, and error states

## 18. Final Product Standard
A strong Analysis Jobs page should let a user:
- launch work quickly
- understand current job state immediately
- inspect failures cleanly
- recover from failed jobs
- open results without friction
- download artifacts confidently

The page should feel like an analysis control center, not just a plain table.

## 19. Recommended shadcn/UI Building Blocks
- Button
- Input
- Select
- Card
- Badge
- Table
- DropdownMenu
- Sheet
- Tabs
- Popover
- Calendar
- Skeleton
- Alert
- AlertDialog
- Tooltip
- Checkbox
- ScrollArea

## 20. Final CTA Set for This Page
Header:
- New Analysis
- Run Pipeline
- Upload Dataset
- Refresh

Per row:
- View Details
- Open Results
- Download Output
- Download Logs
- Retry Job
- Cancel Job
- Duplicate Job

States:
- Start First Analysis
- Retry
- Clear Filters
- Export Metadata
