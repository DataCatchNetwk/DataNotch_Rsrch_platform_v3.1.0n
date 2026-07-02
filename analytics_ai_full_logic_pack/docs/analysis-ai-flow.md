# Analysis & AI Flow

## Inputs

Analysis & AI consumes certified feature sets and experiment setup from Research Studio.

```text
Research Question
  -> Study Design
  -> Cohort
  -> Variable Selection
  -> Protocol
  -> Experiment Setup
  -> Analytics & AI Job
```

## Output handoff

Every analysis creates:

- `AnalysisAIJob`
- `AnalysisAIResult`
- `AnalysisAIVisualizationSpec`
- `AnalysisAIInterpretation`
- `AnalysisAIOutputHandoff`

These are sent to:

```text
Analysis Results
Visualization Studio
Publication Reports
Publication Center
Presentation Builder
```

## Result object standard

```json
{
  "jobId": "job_x",
  "module": "classification",
  "method": "random_forest",
  "metrics": {},
  "tables": [],
  "visualizations": [],
  "interpretation": "",
  "handoff": {
    "outputsReady": true
  }
}
```
