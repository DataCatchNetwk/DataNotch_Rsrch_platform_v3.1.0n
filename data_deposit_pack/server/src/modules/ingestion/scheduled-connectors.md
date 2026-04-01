# Scheduled Connector Ideas

## Priority connectors
- CDC public API / datasets
- WHO data endpoints
- Census API
- Local institutional data feeds
- Secure SFTP batch drops
- Internal CSV / Excel uploads

## Worker jobs
- daily-public-health-sync
- nightly-census-refresh
- weekly-quality-profile
- on-demand-manual-upload-profile

## Recommended workflow
1. Fetch source
2. Store raw snapshot
3. Validate schema
4. Generate profile and sample rows
5. Update catalog metadata
6. Publish new dataset version
7. Notify subscribers / admins
