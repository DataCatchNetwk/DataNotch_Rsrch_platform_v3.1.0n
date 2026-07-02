import type { LifecycleStageConfig } from "@/components/research/research-lifecycle-stage-page";

const base = {
  metrics: [
    { label: "Lifecycle", value: "Active" },
    { label: "Governance", value: "Audit Ready" },
    { label: "Handoff", value: "Enabled" },
  ],
};

export const lifecyclePages: Record<string, LifecycleStageConfig> = {
  projects: {
    ...base,
    eyebrow: "Workspace",
    title: "Projects",
    description: "Plan research objectives, milestones, timelines, and deliverables inside each workspace.",
    purpose: "Projects own research planning. They should not store raw files or execute models; they organize objectives, milestones, team ownership, and deliverables.",
    owns: ["Research objective", "Timeline", "Milestones", "Deliverables"],
    tools: ["Milestone planner", "Deliverable tracker", "Team ownership matrix", "Workspace project links"],
    outputs: ["Project plan", "Milestone status", "Research deliverable checklist"],
    handoffLabel: "Tasks",
    handoffHref: "/dashboard/tasks",
    primaryAction: "Create project task plan",
    secondaryAction: "Review milestones",
  },
  tasks: {
    ...base,
    eyebrow: "Workspace",
    title: "Tasks",
    description: "Kanban-style operational work for researchers, analysts, reviewers, and administrators.",
    purpose: "Tasks own execution tracking. They coordinate who is doing what, what is blocked, what is in review, and what has been completed.",
    owns: ["To Do", "In Progress", "Review", "Completed"],
    tools: ["Kanban board", "Assignment routing", "Review status", "Task audit"],
    outputs: ["Assigned work", "Review queue items", "Completed operational log"],
    handoffLabel: "Runtime Monitoring",
    handoffHref: "/dashboard/monitoring/pipelines",
    primaryAction: "Open task board",
    secondaryAction: "Create review task",
  },
  raw: datasetStage("Raw Datasets", "Imported datasets before cleaning, harmonization, or feature extraction.", "Cleaning & Wrangling", "/dashboard/datasets?prep=cleaning"),
  clean: datasetStage("Clean Datasets", "Post-cleaning datasets with missingness, duplicates, and type issues resolved.", "Harmonization", "/dashboard/datasets?prep=harmonization"),
  harmonized: datasetStage("Harmonized Datasets", "Cross-source aligned datasets with normalized clinical, SDOH, and outcome variables.", "Feature Engineering", "/dashboard/datasets?prep=features"),
  features: datasetStage("Feature Sets", "Analytics-ready variables, risk scores, composite measures, ratios, and model inputs.", "Analysis Studio", "/dashboard/sdoh?tab=analytics"),
  lineage: datasetStage("Dataset Lineage", "Trace raw-to-clean-to-harmonized-to-feature-set transformations and downstream usage.", "Audit Log", "/dashboard/activity"),
  catalog: {
    ...base,
    eyebrow: "Data Management",
    title: "Data Catalog",
    description: "Searchable research inventory for datasets, owners, variables, quality scores, tags, and publications.",
    purpose: "The catalog owns discovery and metadata. It should not replace the Dataset Registry; it indexes assets so users can find and reuse them.",
    owns: ["Dataset descriptions", "Variable dictionary", "Owner and tags", "Quality score", "Publication links"],
    tools: ["Metadata search", "Tag filters", "Variable lookup", "Dataset usage tracking"],
    outputs: ["Catalog record", "Searchable metadata", "Dataset reuse references"],
    handoffLabel: "Dataset Registry",
    handoffHref: "/dashboard/datasets",
    primaryAction: "Search catalog",
    secondaryAction: "Index selected dataset",
  },
  "knowledge-graph": {
    ...base,
    eyebrow: "Data Management",
    title: "Knowledge Graph",
    description: "Interactive patient, SDOH, disease, treatment, intervention, outcome, provider, and geography relationships.",
    purpose: "The Knowledge Graph owns relationship intelligence. It connects data assets into explainable paths that can support cohort design, causal reasoning, analytics, and publication traceability.",
    owns: ["Patient graph", "SDOH graph", "Disease graph", "Outcome graph", "Geography graph"],
    tools: ["Graph explorer", "Path tracing", "Relationship filters", "Evidence links"],
    outputs: ["Traceable graph path", "Causal hypothesis signal", "Publication relationship evidence"],
    handoffLabel: "Research Questions",
    handoffHref: "/dashboard/sdoh?studio=questions",
    primaryAction: "Explore graph",
    secondaryAction: "Create graph-backed question",
  },
  profiling: prepStage("Data Profiling", "Rows, columns, missing values, outliers, distributions, duplicates, and data quality summary.", "Cleaning & Wrangling", "/dashboard/datasets?prep=cleaning"),
  cleaning: prepStage("Cleaning & Wrangling", "Drop columns, rename variables, impute missing values, treat outliers, normalize, and encode variables.", "Harmonization", "/dashboard/datasets?prep=harmonization"),
  harmonization: prepStage("Harmonization", "Align synonymous fields such as Gender, Sex, and PatientSex into canonical variables.", "Feature Engineering", "/dashboard/datasets?prep=features"),
  quality: prepStage("Quality Validation", "Completeness, consistency, accuracy, uniqueness, and validity checks with a quality score.", "Dataset Versioning", "/dashboard/datasets?prep=versions"),
  versions: prepStage("Dataset Versioning", "Git-like dataset history with comparison of variables added, variables removed, and rows changed.", "Dataset Registry", "/dashboard/datasets"),
  questions: researchStage("Research Questions", "Store research questions, objectives, outcomes, and analytic intent.", "Hypothesis Builder", "/dashboard/sdoh?studio=hypothesis"),
  hypothesis: researchStage("Hypothesis Builder", "Create testable hypotheses and link each one directly to required variables and analysis methods.", "Cohort Builder", "/dashboard/sdoh?studio=cohort"),
  cohort: researchStage("Cohort Builder", "Build study cohorts using age, gender, diagnosis, location, and SDOH factor filters.", "Variable Explorer", "/dashboard/sdoh?studio=variables"),
  variables: researchStage("Variable Explorer", "Browse demographic, clinical, SDOH, and outcome variables with distributions and missingness.", "Study Design", "/dashboard/sdoh?studio=study-design"),
  "study-design": researchStage("Study Design", "Select cross-sectional, longitudinal, RCT, case-control, or cohort study templates.", "Research Protocols", "/dashboard/sdoh?studio=protocols"),
  protocols: researchStage("Research Protocols", "Store methods, inclusion criteria, exclusion criteria, IRB notes, and protocol text.", "Analysis Studio", "/dashboard/sdoh?tab=analytics"),
  "population-health": analyticsStage("Population Health Analytics", "Population-level metrics, disparity patterns, community risk, and public-health indicators."),
  biomedical: analyticsStage("Biomedical Analytics", "NeuroTwinFM, imaging, clinical AI, genomics, and biomedical research analytics."),
  automl: analyticsStage("AutoML Studio", "Automated feature selection, model selection, hyperparameter search, and model comparison."),
  analytics: analyticsStage("Analysis Studio", "Descriptive statistics, inference, correlation, regression, classification, survival, SEM, clustering, causal AI, and interpretation workflows."),
  "publication-center": outputStage("Publication Center", "Create Methods, Results, Discussion, reviewer-ready tables, and manuscript-ready narrative."),
  presentations: outputStage("Presentation Builder", "Create slide-ready charts, executive summaries, study figures, and dissemination materials."),
  compliance: {
    ...base,
    eyebrow: "Governance",
    title: "Compliance Center",
    description: "Central governance for approval checkpoints, PHI/PII controls, access policies, and compliance review.",
    purpose: "Compliance owns regulatory control. It reviews data access, publication readiness, audit trails, and sensitive data exposure.",
    owns: ["RBAC policies", "PHI/PII warnings", "Approval checkpoints", "Compliance evidence"],
    tools: ["Policy checks", "Access review", "Publication approval", "Compliance audit"],
    outputs: ["Approval evidence", "Compliance decision", "Policy audit record"],
    handoffLabel: "Audit Log",
    handoffHref: "/dashboard/activity",
    primaryAction: "Run compliance check",
    secondaryAction: "Review access policy",
  },
};

export function getLifecyclePageFromSearch(
  searchParams: URLSearchParams,
): LifecycleStageConfig | null {
  const keys = ["view", "prep", "studio", "domain", "tab"];
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value && lifecyclePages[value]) return lifecyclePages[value];
  }
  return null;
}

function datasetStage(title: string, description: string, handoffLabel: string, handoffHref: string): LifecycleStageConfig {
  return {
    ...base,
    eyebrow: "Dataset Registry",
    title,
    description,
    purpose: "The Dataset Registry owns governed dataset records. It separates raw, clean, harmonized, feature, and lineage views so datasets move through the platform without duplicated responsibilities.",
    owns: ["Dataset metadata", "Version status", "Quality state", "Workspace assignment"],
    tools: ["Dataset filters", "Version tracking", "Lineage viewer", "Analysis readiness checks"],
    outputs: ["Registered dataset", "Dataset profile", "Analysis-ready handoff"],
    handoffLabel,
    handoffHref,
    primaryAction: `Send to ${handoffLabel}`,
    secondaryAction: "Review dataset profile",
  };
}

function prepStage(title: string, description: string, handoffLabel: string, handoffHref: string): LifecycleStageConfig {
  return {
    ...base,
    eyebrow: "Data Preparation",
    title,
    description,
    purpose: "Data Preparation owns transformation from uploaded/source data into trusted, validated, analysis-ready datasets.",
    owns: ["Profiling output", "Cleaning decisions", "Validation checks", "Prepared dataset version"],
    tools: ["Rule engine", "Quality scoring", "Variable transforms", "Preparation audit"],
    outputs: ["Clean dataset", "Preparation report", "Quality score"],
    handoffLabel,
    handoffHref,
    primaryAction: `Continue to ${handoffLabel}`,
    secondaryAction: "Run validation",
  };
}

function researchStage(title: string, description: string, handoffLabel: string, handoffHref: string): LifecycleStageConfig {
  return {
    ...base,
    eyebrow: "Research Studio",
    title,
    description,
    purpose: "Research Studio owns study intent and design. It turns datasets into structured questions, cohorts, variables, protocols, and analysis plans.",
    owns: ["Study intent", "Cohort logic", "Variable plan", "Protocol evidence"],
    tools: ["Builder workflow", "Research templates", "Eligibility filters", "Protocol notes"],
    outputs: ["Cohort dataset", "Study design", "Analysis plan"],
    handoffLabel,
    handoffHref,
    primaryAction: `Proceed to ${handoffLabel}`,
    secondaryAction: "Save research plan",
  };
}

function analyticsStage(title: string, description: string): LifecycleStageConfig {
  return {
    ...base,
    eyebrow: "Analytics & AI",
    title,
    description,
    purpose: "Analytics & AI owns execution of statistical, machine-learning, causal, SDOH, population, and biomedical analysis workflows.",
    owns: ["Analysis plan", "Model run", "Metrics", "Artifacts"],
    tools: ["Analysis runner", "Model comparison", "AI recommendations", "Artifact registry"],
    outputs: ["Result object", "Model metrics", "Interpretation payload"],
    handoffLabel: "Visualization Studio",
    handoffHref: "/dashboard/visualizations",
    primaryAction: "Run analysis",
    secondaryAction: "Review model inputs",
  };
}

function outputStage(title: string, description: string): LifecycleStageConfig {
  return {
    ...base,
    eyebrow: "Outputs",
    title,
    description,
    purpose: "Outputs own conversion of result objects into visualizations, reports, publication artifacts, exports, and presentations.",
    owns: ["Tables", "Figures", "Narratives", "Exports"],
    tools: ["Table generator", "Figure builder", "Manuscript drafting", "Export packaging"],
    outputs: ["Publication table", "Report", "Presentation", "Export bundle"],
    handoffLabel: "Compliance Center",
    handoffHref: "/dashboard/access?tab=compliance",
    primaryAction: "Generate output",
    secondaryAction: "Submit for review",
  };
}
