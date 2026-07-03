# Final Admin Styling Upgrade Spec

## Objective
Upgrade the Admin Dashboard from a clean starter into an enterprise-grade control center with stronger hierarchy, denser operational context, and more authoritative visual styling.

## 1. Visual direction
The Admin Dashboard should feel executive, operational, trustworthy, and distinct from the user dashboard.

Use:
- slate and white as the structural base
- violet as the interaction accent
- emerald for healthy state
- amber for warning
- red for critical state
- blue for informational activity

## 2. Header / hero upgrades
Add:
- page label: Admin Console
- title: Admin Dashboard
- support text
- last sync timestamp
- role badge
- environment badge
- quick action buttons:
  - Refresh Metrics
  - Export Audit
  - Broadcast Notice
  - Create Admin

Use a subtle hero card or tinted block instead of plain text alone.

## 3. Alert / risk strip
Place a row directly below the hero that surfaces urgent admin information:
- pending approvals
- suspicious sign-ins
- queue latency
- storage warnings
- failed job spikes

Use semantic colors:
- green for healthy
- amber for warning
- red for critical

Each alert should include:
- title
- one-line summary
- CTA link

## 4. Metric card upgrade
Each metric card should include:
- icon block
- large value
- helper/trend text
- hover elevation
- subtle accent tone

Recommended cards:
- Total Users
- Active Sessions
- Total Datasets
- Running Jobs
- Pending Approvals
- System Health

Example helper text:
- +12 this week
- stable last 24h
- no new uploads today
- 18% below last hour
- all caught up

## 5. Section grouping
Group the lower dashboard content into:
- Governance
- Compliance
- Operations

This prevents the page from feeling like one undifferentiated card list.

## 6. Feature card polish
Feature cards should include:
- summary badge
- stronger title typography
- hover elevation
- clear directional affordance
- tighter copy

Example badges:
- overview
- users
- governance
- super-admin
- 0 pending
- 18 today
- healthy

## 7. Reduce empty whitespace with live sections
Add at least two live data sections:
- Recent Audit Activity
- Operational Snapshot
- Recent Approvals
- Risk Events
- Queue Health
- Failed Job Summary

These sections make the dashboard feel active and enterprise-grade.

## 8. Improve status chips
Use compact chips for:
- total users
- active sessions
- datasets
- running jobs
- pending approvals
- system health

All chips should use consistent spacing and visual treatment.

## 9. Sidebar polish
Improve admin nav with:
- stronger active state
- grouped intent labels if needed
- optional lock/super-admin badges
- clearer visual separation from main content

## 10. Motion and interaction
Use restrained, premium feedback:
- hover elevation
- soft border transition
- no excessive animation
- subtle card lift

## 11. Final layout order
Recommended page order:
1. Admin hero
2. Alert strip
3. Status chips
4. Metric cards
5. Governance / Compliance / Operations card groups
6. Recent Audit Activity
7. Operational Snapshot

## 12. Final result
The admin dashboard should answer:
- What needs attention now?
- What is the system state?
- What actions are available immediately?
- Where should the admin go next?

The page should feel like a real operational control center.
