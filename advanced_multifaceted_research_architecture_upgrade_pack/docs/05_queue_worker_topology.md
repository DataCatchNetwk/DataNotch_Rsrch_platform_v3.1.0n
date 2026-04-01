# Queue and Worker Topology

## Queues
- `dataset.ingest`
- `dataset.profile`
- `cohort.build`
- `feature.materialize`
- `analysis.run`
- `metrics.compute`
- `genomics.transform`
- `report.generate`
- `workspace.snapshot`

## Worker responsibilities
### Ingestion Worker
- source fetch
- schema validation
- deposit storage
- lineage update

### Cohort Worker
- apply inclusion/exclusion rules
- build preview counts
- materialize cohort snapshot

### Feature Worker
- compute derived variables
- validate recipes
- update feature registry

### Analysis Worker
- execute statistical and ML jobs
- stream status/logs
- persist artifacts

### Metrics Worker
- compute evaluation suite
- compare against previous runs
- publish to experiment record

### Genomics Worker
- ingest omics files/metadata
- run annotation and matrix transforms
- produce derived research-ready objects
