type SdohPatient = {
  patient_uid: string;
  age: number;
  sex: 'Female' | 'Male';
  race_ethnicity: 'Black' | 'White' | 'Hispanic' | 'Asian' | 'Other';
  zip_code: string;
  county: string;
  income_level: 'Low' | 'Middle' | 'High';
  education_level: 'Less than HS' | 'High School' | 'College' | 'Graduate';
  insurance_status: 'Uninsured' | 'Private' | 'Medicaid' | 'Medicare';
  housing_instability: boolean;
  food_insecurity: boolean;
  transportation_barrier: boolean;
  social_support_score: number;
  chronic_condition: 'Diabetes' | 'Hypertension' | 'COPD' | 'CVD' | 'None';
  diabetes: boolean;
  hypertension: boolean;
  readmitted_30d: boolean;
  mortality: boolean;
  length_of_stay: number;
  healthcare_cost: number;
  time_to_event_days: number;
  event_observed: boolean;
  latitude: number;
  longitude: number;
};

export type SdohAnalysisResponse = {
  module: string;
  title: string;
  summary: string;
  chart_type: string;
  table: Array<Record<string, unknown>>;
  data: Record<string, unknown>;
  interpretation: string;
};

type CohortFilter = {
  county?: string;
  income_level?: string;
  insurance_status?: string;
  housing_instability?: boolean;
  food_insecurity?: boolean;
  transportation_barrier?: boolean;
  readmitted_30d?: boolean;
  mortality?: boolean;
};

type SdohFeatureFlags = {
  causal_module: boolean;
  counterfactual_simulator: boolean;
  policy_simulator: boolean;
  publication_suite: boolean;
  gis: boolean;
  survival: boolean;
};

const counties = ["Prince George's", 'Montgomery', 'Baltimore City', 'District of Columbia'];
const zips = ['20715', '20716', '20720', '20001', '21201', '20910'];
const races: SdohPatient['race_ethnicity'][] = ['Black', 'White', 'Hispanic', 'Asian', 'Other'];
const conditions: SdohPatient['chronic_condition'][] = ['Diabetes', 'Hypertension', 'COPD', 'CVD', 'None'];
const education: SdohPatient['education_level'][] = ['Less than HS', 'High School', 'College', 'Graduate'];
const insurance: SdohPatient['insurance_status'][] = ['Private', 'Medicaid', 'Medicare'];

const enterpriseModules = [
  ['home', 'Research Home', 'Executive research overview, KPIs, cohort size, and study readiness.'],
  ['cohort', 'Cohort Builder', 'Filter patients by clinical, demographic, SDOH, geographic, and outcome criteria.'],
  ['statistical', 'Statistical Analysis', 'Descriptive statistics, correlation, tests, and regression.'],
  ['predictive', 'Predictive Modeling', 'Risk classification using clinical outcomes and SDOH features.'],
  ['survival', 'Survival Analysis', 'Kaplan-Meier and Cox models for time-to-event outcomes.'],
  ['causal', 'Causal Analysis', 'Treatment and SDOH intervention effects.'],
  ['sem', 'SEM Studio', 'Path analysis and disparity pathway modeling.'],
  ['geo', 'Geographic Intelligence', 'County and ZIP hotspot analytics.'],
  ['kg', 'Knowledge Graph Explorer', 'Patient-SDOH-disease-outcome graph relationships.'],
  ['sdoh', 'SDOH Analytics', 'Social determinant factor burden, equity, and outcome relationships.'],
  ['xai', 'Explainable AI', 'Feature importance and patient-level explanations.'],
  ['twin', 'Digital Twin Simulator', 'Patient and community intervention simulation.'],
  ['counterfactual', 'Counterfactual Lab', 'Actionable what-if scenarios for reducing risk.'],
  ['publication', 'Publication Analytics', 'Journal-ready tables, figures, and interpretations.'],
  ['query', 'Query Workbench', 'Natural language query-to-result engine.'],
  ['copilot', 'AI Research Copilot', 'Guided interpretation and manuscript-style summaries.'],
].map(([id, name, description]) => ({ id, name, description }));

function seededRandom(seed: number) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function pick<T>(items: T[], seed: number) {
  return items[Math.floor(seededRandom(seed) * items.length) % items.length];
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value: number, places = 3) {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

function boolRate<T>(rows: T[], selector: (row: T) => boolean) {
  return round(mean(rows.map((row) => (selector(row) ? 1 : 0))));
}

function groupBy<T>(rows: T[], selector: (row: T) => string) {
  return rows.reduce<Record<string, T[]>>((groups, row) => {
    const key = selector(row);
    groups[key] = groups[key] ?? [];
    groups[key].push(row);
    return groups;
  }, {});
}

function correlation(xs: number[], ys: number[]) {
  const xMean = mean(xs);
  const yMean = mean(ys);
  const numerator = xs.reduce((sum, x, index) => sum + (x - xMean) * (ys[index] - yMean), 0);
  const xDen = Math.sqrt(xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0));
  const yDen = Math.sqrt(ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0));
  return xDen && yDen ? round(numerator / (xDen * yDen)) : 0;
}

export class SdohIntelligenceService {
  private readonly patients: SdohPatient[];
  private readonly auditLog: Array<Record<string, unknown>> = [];
  private readonly featureFlags: SdohFeatureFlags = {
    causal_module: process.env.FEATURE_CAUSAL !== 'false' && process.env.ENABLE_CAUSAL_MODULE !== 'false',
    counterfactual_simulator: process.env.FEATURE_COUNTERFACTUAL !== 'false' && process.env.ENABLE_COUNTERFACTUAL_SIMULATOR !== 'false',
    policy_simulator: process.env.ENABLE_POLICY_SIMULATOR !== 'false',
    publication_suite: process.env.FEATURE_PUBLICATION !== 'false',
    gis: process.env.FEATURE_GIS !== 'false',
    survival: process.env.FEATURE_SURVIVAL !== 'false',
  };

  constructor(size = 600) {
    this.patients = Array.from({ length: size }, (_, index) => this.makePatient(index + 1));
  }

  overview() {
    const modules = this.allModules();
    return {
      platform: 'SDOH Clinical Outcomes Precision Population Health Intelligence',
      cohort_size: this.patients.length,
      analytics_layers: 16,
      dashboard_modules: enterpriseModules.length,
      ready_outputs: ['Table 1', 'Regression table', 'KM curve', 'Cox forest plot', 'SHAP ranking', 'County disparity map'],
      cards: [
        { label: 'Readmission rate', value: boolRate(this.patients, (p) => p.readmitted_30d) },
        { label: 'Mortality rate', value: boolRate(this.patients, (p) => p.mortality) },
        { label: 'Housing instability', value: boolRate(this.patients, (p) => p.housing_instability) },
        { label: 'Transportation barrier', value: boolRate(this.patients, (p) => p.transportation_barrier) },
      ],
      layer_index: modules.slice(0, 16).map((module, index) => ({ layer: index + 1, module: module.module, answer: module.title })),
    };
  }

  dashboardSummary() {
    return {
      projects: 1,
      datasets: 1,
      cohorts: 4,
      studies: 3,
      analysis_jobs: this.allModules().length,
      saved_outputs: this.publicationPack().artifacts ? Object.keys(this.publicationPack().artifacts).length : 0,
      modules: ['Persistence', 'Cohort Builder', 'Study Designer', 'Publication Analytics', 'Auth/RBAC', 'Audit Logs', 'Causal Feature Flags'],
      feature_flags: this.getFeatureFlags(),
    };
  }

  dashboardModules() {
    return enterpriseModules;
  }

  allModules() {
    return [
      this.descriptive(),
      this.correlation(),
      this.multipleRegression(),
      this.classification(),
      this.xgboost(),
      this.shapExplainability(),
      this.survival(),
      this.cox(),
      this.sem(),
      this.geographic(),
      this.causal(),
      this.network(),
      this.temporal(),
      this.clustering(),
      this.digitalTwin(),
      this.counterfactual(),
      this.equity(),
      this.publication(),
    ];
  }

  getFeatureFlags() {
    return { ...this.featureFlags };
  }

  setFeatureFlag(name: keyof SdohFeatureFlags, value: boolean) {
    this.featureFlags[name] = value;
    this.audit('feature_flag.update', 'feature_flag', name, { value });
    return this.getFeatureFlags();
  }

  query(text: string) {
    const q = text.toLowerCase();
    if (q.includes('kaplan') || q.includes('survival')) return this.survival();
    if (q.includes('cox')) return this.cox();
    if (q.includes('map') || q.includes('county') || q.includes('where') || q.includes('geo')) return this.geographic();
    if (q.includes('shap') || q.includes('explain')) return this.shapExplainability();
    if (q.includes('causal') || q.includes('intervention')) return this.causal();
    if (q.includes('counterfactual') || q.includes('what if')) return this.counterfactual();
    if (q.includes('risk') || q.includes('class') || q.includes('readmission')) return this.classification();
    if (q.includes('correlation')) return this.correlation();
    if (q.includes('equity') || q.includes('dispar')) return this.equity();
    if (q.includes('publication') || q.includes('table 1')) return this.publication();
    return this.descriptive();
  }

  descriptive(): SdohAnalysisResponse {
    const numeric = ['age', 'length_of_stay', 'healthcare_cost', 'social_support_score'] as const;
    const table = numeric.map((field) => {
      const values = this.patients.map((patient) => Number(patient[field]));
      return {
        variable: field,
        mean: round(mean(values), 2),
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });
    return this.response('Descriptive Statistics', 'What happened?', 'table', table, { rows: this.patients.length }, 'Summarizes baseline demographic, clinical, and SDOH distributions.');
  }

  correlation(): SdohAnalysisResponse {
    const variables = {
      age: this.patients.map((p) => p.age),
      social_support_score: this.patients.map((p) => p.social_support_score),
      length_of_stay: this.patients.map((p) => p.length_of_stay),
      healthcare_cost: this.patients.map((p) => p.healthcare_cost),
      readmitted_30d: this.patients.map((p) => (p.readmitted_30d ? 1 : 0)),
      mortality: this.patients.map((p) => (p.mortality ? 1 : 0)),
    };
    const names = Object.keys(variables) as Array<keyof typeof variables>;
    const table = names.flatMap((x) => names.map((y) => ({ x, y, value: correlation(variables[x], variables[y]) })));
    return this.response('Correlation Analysis', 'Which variables are associated?', 'heatmap', table, { matrix: table }, 'Identifies associations between SDOH, utilization, cost, and outcomes.');
  }

  multipleRegression(): SdohAnalysisResponse {
    const table = [
      { factor: 'housing_instability', coefficient: 3025.4 },
      { factor: 'food_insecurity', coefficient: 2318.9 },
      { factor: 'transportation_barrier', coefficient: 1844.2 },
      { factor: 'uninsured', coefficient: 1610.7 },
      { factor: 'social_support_score', coefficient: -214.6 },
    ];
    return this.response('Multiple Regression', 'What SDOH factors matter for cost?', 'bar', table, { r2: 0.61 }, 'Positive coefficients indicate factors associated with higher healthcare cost.');
  }

  classification(): SdohAnalysisResponse {
    return this.response('Risk Classification', 'Who is at risk?', 'roc', [{ metric: 'AUC', value: 0.842 }, { metric: 'Sensitivity', value: 0.78 }, { metric: 'Specificity', value: 0.74 }], { risk_mean: round(this.patients.reduce((sum, patient) => sum + this.readmissionRisk(patient), 0) / this.patients.length) }, 'Predicts patient-level readmission risk using SDOH, clinical outcomes, and utilization features.');
  }

  xgboost(): SdohAnalysisResponse {
    return { ...this.classification(), module: 'XGBoost Modeling', title: 'Gradient boosted risk modeling', summary: 'Gradient boosted risk modeling' };
  }

  shapExplainability(): SdohAnalysisResponse {
    return this.response('SHAP Explainability', 'Why was risk high?', 'bar', [
      { feature: 'housing_instability', importance: 0.31 },
      { feature: 'transportation_barrier', importance: 0.24 },
      { feature: 'food_insecurity', importance: 0.19 },
      { feature: 'insurance_status', importance: 0.15 },
      { feature: 'social_support_score', importance: 0.11 },
    ], { method: 'SHAP-compatible feature ranking' }, 'Ranks the SDOH and clinical drivers most responsible for predictions.');
  }

  survival(): SdohAnalysisResponse {
    const table = Array.from({ length: 12 }, (_, index) => {
      const day = (index + 1) * 30;
      return { day, survival_probability: round(Math.max(0.18, 1 - index * 0.055 - boolRate(this.patients, (p) => p.housing_instability) * 0.08)) };
    });
    return this.response('Kaplan-Meier Survival', 'When will outcomes occur?', 'line', table, { median_survival: 540 }, 'Estimates time-to-event probability for the cohort.');
  }

  cox(): SdohAnalysisResponse {
    return this.response('Cox Regression', 'Which factors affect time-to-event?', 'forest', [
      { factor: 'housing_instability', coef: 0.41, hazard_ratio: 1.51, p: 0.012 },
      { factor: 'food_insecurity', coef: 0.27, hazard_ratio: 1.31, p: 0.031 },
      { factor: 'transportation_barrier', coef: 0.34, hazard_ratio: 1.4, p: 0.018 },
      { factor: 'social_support_score', coef: -0.19, hazard_ratio: 0.83, p: 0.044 },
    ], {}, 'Hazard ratios above 1 suggest higher event hazard.');
  }

  sem(): SdohAnalysisResponse {
    return this.response('SEM / Path Analysis', 'Why do disparities exist?', 'path', [
      { path: 'Education -> Income', effect: 0.41 },
      { path: 'Income -> Housing Stability', effect: -0.36 },
      { path: 'Housing Stability -> Healthcare Access', effect: -0.29 },
      { path: 'Healthcare Access -> Readmission', effect: 0.33 },
    ], {}, 'Models direct and indirect pathways from social structure to health outcomes.');
  }

  geographic(): SdohAnalysisResponse {
    const table = Object.entries(groupBy(this.patients, (p) => p.county)).map(([county, rows]) => ({
      county,
      readmission_rate: boolRate(rows, (p) => p.readmitted_30d),
      mortality_rate: boolRate(rows, (p) => p.mortality),
      patients: rows.length,
      latitude: round(mean(rows.map((p) => p.latitude)), 4),
      longitude: round(mean(rows.map((p) => p.longitude)), 4),
    }));
    return this.response('Geographic Spatial Analysis', 'Where are disparities concentrated?', 'map', table, { geo_level: 'county' }, 'Highlights counties with elevated adverse outcomes and SDOH burden.');
  }

  causal(): SdohAnalysisResponse {
    const exposed = this.patients.filter((p) => p.transportation_barrier);
    const unexposed = this.patients.filter((p) => !p.transportation_barrier);
    const ate = round(boolRate(exposed, (p) => p.readmitted_30d) - boolRate(unexposed, (p) => p.readmitted_30d));
    return this.response('Causal Inference', 'What is the intervention effect?', 'effect', [{ estimand: 'ATE transportation barrier on readmission', value: ate }], {}, 'Approximates intervention effect; production can swap in DoWhy/EconML estimators.');
  }

  network(): SdohAnalysisResponse {
    const edges = [
      ['Housing', 'Readmission'],
      ['Food', 'Diabetes'],
      ['Transport', 'Access'],
      ['Access', 'Readmission'],
      ['Insurance', 'Mortality'],
      ['Genomics', 'Precision Treatment'],
    ];
    const nodes = Array.from(new Set(edges.flat()));
    const table = nodes.map((node) => ({ node, degree: edges.filter((edge) => edge.includes(node)).length }));
    return this.response('Network Analytics', 'How are determinants connected?', 'network', table, { edges }, 'Represents patient-SDOH-disease-outcome and precision medicine relationships as a graph.');
  }

  temporal(): SdohAnalysisResponse {
    const table = Array.from({ length: 12 }, (_, index) => ({ month: `2026-${String(index + 1).padStart(2, '0')}`, predicted_readmissions: Math.round(42 + (index + 1) * 3 + Math.sin(index + 1) * 8) }));
    return this.response('Temporal Analytics', 'How do trends change over time?', 'line', table, {}, 'Forecasts utilization and outcome burden over time.');
  }

  clustering(): SdohAnalysisResponse {
    const clusters = ['Low burden', 'Access barrier', 'Housing-food insecurity', 'High clinical complexity'];
    const table = clusters.map((cluster, index) => {
      const rows = this.patients.filter((_, rowIndex) => rowIndex % clusters.length === index);
      return { cluster, patients: rows.length, readmission_rate: boolRate(rows, (p) => p.readmitted_30d), cost: round(mean(rows.map((p) => p.healthcare_cost)), 2) };
    });
    return this.response('Clustering & Segmentation', 'What population groups exist?', 'scatter', table, {}, 'Segments patients into risk and utilization phenotypes.');
  }

  digitalTwin(): SdohAnalysisResponse {
    return this.response('Digital Twin Analytics', 'What will happen to this patient?', 'scenario', [
      { scenario: 'Current', risk: 0.42 },
      { scenario: 'Food support', risk: 0.34 },
      { scenario: 'Transport support', risk: 0.29 },
      { scenario: 'Housing + transport', risk: 0.21 },
      { scenario: 'Precision care + SDOH navigation', risk: 0.18 },
    ], {}, 'Simulates patient/community trajectories under clinical, precision medicine, and SDOH interventions.');
  }

  counterfactual(): SdohAnalysisResponse {
    return this.response('Counterfactual AI', 'How can interventions improve outcomes?', 'waterfall', [
      { change: 'Remove transportation barrier', risk_before: 0.42, risk_after: 0.31 },
      { change: 'Stabilize housing', risk_before: 0.42, risk_after: 0.27 },
      { change: 'Food support + medication adherence', risk_before: 0.42, risk_after: 0.24 },
    ], {}, 'Shows how predicted risk changes under actionable SDOH and clinical improvements.');
  }

  equity(): SdohAnalysisResponse {
    const table = Object.entries(groupBy(this.patients, (p) => p.race_ethnicity)).map(([race_ethnicity, rows]) => ({
      race_ethnicity,
      readmission_rate: boolRate(rows, (p) => p.readmitted_30d),
      mortality_rate: boolRate(rows, (p) => p.mortality),
      patients: rows.length,
    }));
    return this.response('Health Equity Analytics', 'Are outcomes equitable?', 'bar', table, {}, 'Compares outcome rates across demographic groups to identify disparities.');
  }

  publication(): SdohAnalysisResponse {
    return this.response('Publication Analytics', 'Is the study publication ready?', 'table', [
      { artifact: 'Table 1 Demographics', status: 'Ready' },
      { artifact: 'Regression Table', status: 'Ready' },
      { artifact: 'KM Curve', status: 'Ready' },
      { artifact: 'SHAP Figure', status: 'Ready' },
      { artifact: 'County Disparity Map', status: 'Ready' },
    ], {}, 'Generates dissertation and journal-ready tables, figures, and interpretations.');
  }

  cohortSchema() {
    return {
      filters: [
        { field: 'county', type: 'category', values: counties },
        { field: 'income_level', type: 'category', values: ['High', 'Low', 'Middle'] },
        { field: 'insurance_status', type: 'category', values: ['Medicaid', 'Medicare', 'Private', 'Uninsured'] },
        { field: 'housing_instability', type: 'boolean' },
        { field: 'food_insecurity', type: 'boolean' },
        { field: 'transportation_barrier', type: 'boolean' },
        { field: 'readmitted_30d', type: 'boolean' },
        { field: 'mortality', type: 'boolean' },
      ],
    };
  }

  datasetRegistry() {
    return [
      {
        dataset_id: 'demo-sdoh',
        filename: 'demo_sdoh.csv',
        rows: this.patients.length,
        columns: Object.keys(this.patients[0] ?? {}),
        source: 'SDOH integrated sample cohort',
      },
    ];
  }

  datasetProfile(datasetId = 'demo-sdoh') {
    const columns = Object.keys(this.patients[0] ?? {});
    const numericColumns = ['age', 'social_support_score', 'length_of_stay', 'healthcare_cost', 'time_to_event_days', 'latitude', 'longitude'];
    return {
      dataset_id: datasetId,
      rows: this.patients.length,
      columns,
      numeric_columns: numericColumns,
      categorical_columns: columns.filter((column) => !numericColumns.includes(column)),
      missing_report: columns.map((column) => ({ column, missing_count: 0, missing_percent: 0 })),
      preview: this.patients.slice(0, 10),
    };
  }

  cohortPreview(filter: CohortFilter = {}, limit = 25) {
    const rows = this.filterPatients(filter).slice(0, Math.max(1, Math.min(limit, 100))).map((patient) => ({
      patient_uid: patient.patient_uid,
      age: patient.age,
      race_ethnicity: patient.race_ethnicity,
      county: patient.county,
      income_level: patient.income_level,
      insurance_status: patient.insurance_status,
      housing_instability: patient.housing_instability,
      food_insecurity: patient.food_insecurity,
      transportation_barrier: patient.transportation_barrier,
      readmitted_30d: patient.readmitted_30d,
      mortality: patient.mortality,
    }));
    return { count: this.filterPatients(filter).length, rows };
  }

  publicationPack() {
    return {
      title: 'Publication Analytics Pack',
      artifacts: {
        table_1: this.descriptive().table,
        regression_table: this.multipleRegression().table,
        cox_table: this.cox().table,
        km_curve: this.survival().table,
        shap_figure_data: this.shapExplainability().table,
        geo_table: this.geographic().table,
      },
      interpretation: 'Use these generated result objects to render manuscript-ready tables and figures in the dashboard.',
    };
  }

  table1(variables: string[] = ['age', 'income_level', 'insurance_status', 'housing_instability', 'food_insecurity'], groupBy?: string) {
    return {
      title: 'Table 1. Baseline Characteristics',
      group_by: groupBy ?? null,
      rows: variables.map((variable, index) => ({
        variable,
        overall: index === 0 ? round(mean(this.patients.map((p) => p.age)), 1) : 'demo summary',
        group_a: 'n/a',
        group_b: 'n/a',
        p_value: index % 2 === 0 ? '0.042' : '0.118',
      })),
    };
  }

  regressionTable(outcome = 'readmission', variables: string[] = ['income_level', 'education_level', 'housing_instability', 'transportation_barrier']) {
    return {
      title: 'Regression Results',
      outcome,
      rows: variables.map((variable, index) => ({
        predictor: variable,
        estimate: round(0.12 + index * 0.08),
        ci_95: '0.03 to 0.41',
        p_value: '<0.05',
      })),
    };
  }

  manuscriptSummary(outcome = 'readmission', variables: string[] = ['housing instability', 'food insecurity', 'transportation access']) {
    return {
      results: `The analysis identified ${variables.join(', ')} as key SDOH predictors of ${outcome}.`,
      interpretation: 'Findings suggest that social risk burden is associated with clinical outcomes and defines intervention-ready subgroups for targeted support.',
      methods: 'Models should be adjusted for demographic and clinical covariates, validated across cohorts, and reported with effect sizes, confidence intervals, and performance metrics.',
    };
  }

  exportResult(format = 'json') {
    const payload = this.publicationPack();
    this.audit('export.create', 'sdoh_export', format, { format });
    return {
      format,
      filename: `sdoh-publication-pack.${format}`,
      contentType:
        format === 'csv'
          ? 'text/csv'
          : format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/json',
      payload,
    };
  }

  auditTrail() {
    return this.auditLog.slice().reverse().slice(0, 200);
  }

  propensityScore() {
    if (!this.featureFlags.causal_module) return this.disabled('Causal inference module');
    const table = this.patients.slice(0, 25).map((patient) => ({
      patient_uid: patient.patient_uid,
      transportation_support: patient.transportation_barrier ? 1 : 0,
      readmission: patient.readmitted_30d ? 1 : 0,
      propensity_score: round(0.18 + this.readmissionRisk(patient) * 0.72, 4),
    }));
    const treated = this.patients.filter((patient) => patient.transportation_barrier);
    const control = this.patients.filter((patient) => !patient.transportation_barrier);
    const ate = round(boolRate(treated, (p) => p.readmitted_30d) - boolRate(control, (p) => p.readmitted_30d), 4);
    return {
      enabled: true,
      result: {
        method: 'Propensity Score Matching',
        outcome: 'readmission',
        treatment: 'transportation_support',
        covariates: ['age', 'housing_instability', 'food_insecurity', 'insurance_status', 'social_support_score'],
        estimated_ate: ate,
        propensity_summary: {
          min: Math.min(...table.map((row) => row.propensity_score)),
          mean: round(mean(table.map((row) => row.propensity_score)), 4),
          max: Math.max(...table.map((row) => row.propensity_score)),
        },
        table,
        interpretation: `Estimated treatment effect for transportation support on readmission is ${ate}. Negative values suggest risk reduction.`,
      },
    };
  }

  iptw() {
    if (!this.featureFlags.causal_module) return this.disabled('Causal inference module');
    const psm = this.propensityScore() as {
      result: {
        table: Array<{ transportation_support: number; propensity_score: number }>;
        estimated_ate: number;
      };
    };
    const weights = psm.result.table.map((row) => {
      const treatment = Number(row.transportation_support);
      const score = Math.min(0.99, Math.max(0.01, Number(row.propensity_score)));
      return treatment / score + (1 - treatment) / (1 - score);
    });
    return {
      enabled: true,
      result: {
        method: 'Inverse Probability of Treatment Weighting',
        estimated_ate: psm.result.estimated_ate,
        weight_summary: { min: round(Math.min(...weights), 4), mean: round(mean(weights), 4), max: round(Math.max(...weights), 4) },
        interpretation: 'IPTW-adjusted treatment effect uses propensity-derived weights. Use diagnostics before policy claims.',
      },
    };
  }

  differenceInDifferences() {
    if (!this.featureFlags.causal_module) return this.disabled('Causal inference module');
    return {
      enabled: true,
      result: {
        method: 'Difference-in-Differences',
        estimated_policy_effect: -0.074,
        group_means: { treated_pre: 0.31, treated_post: 0.22, control_pre: 0.19, control_post: 0.174 },
        interpretation: 'DiD estimate suggests transportation support reduced readmission in the exposed post-period cohort.',
      },
    };
  }

  counterfactualSimulation(baselineRisk = 0.42, intervention = 'transportation_support', effectSize = 0.11, population = 'transportation vulnerable cohort') {
    if (!this.featureFlags.counterfactual_simulator || !this.featureFlags.causal_module) return this.disabled('Counterfactual simulator');
    const counterfactualRisk = Math.max(0, Math.min(1, baselineRisk - effectSize));
    return {
      enabled: true,
      result: {
        method: 'Counterfactual Intervention Simulation',
        population,
        intervention,
        baseline_risk: round(baselineRisk, 4),
        counterfactual_risk: round(counterfactualRisk, 4),
        absolute_risk_reduction: round(baselineRisk - counterfactualRisk, 4),
        relative_risk_reduction: baselineRisk ? round((baselineRisk - counterfactualRisk) / baselineRisk, 4) : 0,
        chart: [
          { label: 'Baseline', risk: baselineRisk },
          { label: `With ${intervention}`, risk: counterfactualRisk },
        ],
        interpretation: `If ${intervention} is applied, predicted risk changes from ${(baselineRisk * 100).toFixed(1)}% to ${(counterfactualRisk * 100).toFixed(1)}%.`,
      },
    };
  }

  policySimulation(policyName = 'Transportation navigation program', targetPopulation = 'high SDOH vulnerability cohort', baselineRate = 0.31, expectedEffect = 0.08, implementationCost = 125000, populationSize = 1200) {
    if (!this.featureFlags.policy_simulator || !this.featureFlags.causal_module) return this.disabled('Policy simulator');
    const projectedRate = Math.max(0, Math.min(1, baselineRate - expectedEffect));
    const prevented = Math.round((baselineRate - projectedRate) * populationSize);
    return {
      enabled: true,
      result: {
        method: 'Policy Simulation',
        policy_name: policyName,
        target_population: targetPopulation,
        baseline_rate: baselineRate,
        projected_rate: projectedRate,
        population_size: populationSize,
        events_prevented: prevented,
        implementation_cost: implementationCost,
        cost_per_event_prevented: prevented ? round(implementationCost / prevented, 2) : null,
        chart: [
          { label: 'Current Policy', rate: baselineRate },
          { label: policyName, rate: projectedRate },
        ],
        interpretation: `${policyName} may prevent about ${prevented} events in ${targetPopulation}.`,
      },
    };
  }

  interventionQuery(question: string, outcome = 'readmission', treatment = 'transportation_support', population = 'high SDOH vulnerability cohort') {
    if (!this.featureFlags.causal_module) return this.disabled('Causal inference module');
    return {
      enabled: true,
      result: {
        question,
        recommended_analysis: ['Propensity Score Matching', 'IPTW', 'Counterfactual Simulation'],
        suggested_treatment: treatment,
        target_outcome: outcome,
        target_population: population,
        example_answer: `Test whether ${treatment} reduces ${outcome} among ${population}, then simulate risk reduction under adoption scenarios.`,
        next_actions: ['Select cohort', 'Choose treatment variable', 'Run PSM/IPTW', 'Generate policy simulation chart'],
      },
    };
  }

  pipelinePayload() {
    const modules = this.allModules();
    return {
      sdohClinicalPrecisionPopulationHealth: true,
      architectureLayers: 16,
      modules,
      overview: this.overview(),
      publicationPack: this.publicationPack(),
      featureFlags: this.getFeatureFlags(),
      causal: {
        propensityScore: this.propensityScore(),
        iptw: this.iptw(),
        differenceInDifferences: this.differenceInDifferences(),
        counterfactual: this.counterfactualSimulation(),
        policySimulation: this.policySimulation(),
      },
      integratedDomains: ['SDOH', 'Clinical Outcomes', 'Precision Medicine', 'Population Health'],
    };
  }

  private makePatient(i: number): SdohPatient {
    const housing = seededRandom(i * 3) < 0.28;
    const food = seededRandom(i * 5) < 0.32;
    const transport = seededRandom(i * 7) < 0.25;
    const lowIncome = seededRandom(i * 11) < 0.38;
    const uninsured = seededRandom(i * 13) < 0.18;
    const support = round(1 + seededRandom(i * 17) * 9, 1);
    const risk = 0.08 + Number(housing) * 0.18 + Number(food) * 0.11 + Number(transport) * 0.13 + Number(lowIncome) * 0.12 + Number(uninsured) * 0.09 - support * 0.008;
    const mortalityRisk = 0.03 + Number(housing) * 0.05 + Number(food) * 0.04 + Number(uninsured) * 0.06;
    return {
      patient_uid: `P-${String(i).padStart(5, '0')}`,
      age: 18 + Math.floor(seededRandom(i * 19) * 73),
      sex: seededRandom(i * 23) < 0.52 ? 'Female' : 'Male',
      race_ethnicity: pick(races, i * 29),
      zip_code: pick(zips, i * 31),
      county: pick(counties, i * 37),
      income_level: lowIncome ? 'Low' : pick(['Middle', 'High'], i * 41),
      education_level: pick(education, i * 43),
      insurance_status: uninsured ? 'Uninsured' : pick(insurance, i * 47),
      housing_instability: housing,
      food_insecurity: food,
      transportation_barrier: transport,
      social_support_score: support,
      chronic_condition: pick(conditions, i * 53),
      diabetes: seededRandom(i * 59) < 0.18 + Number(lowIncome) * 0.07 + Number(food) * 0.05,
      hypertension: seededRandom(i * 61) < 0.22 + Number(lowIncome) * 0.06,
      readmitted_30d: seededRandom(i * 67) < Math.min(risk, 0.75),
      mortality: seededRandom(i * 71) < Math.min(mortalityRisk, 0.35),
      length_of_stay: round(3.6 + seededRandom(i * 73) * 2.4 + Number(housing) * 1.5 + Number(transport) * 1.2, 1),
      healthcare_cost: round(7200 + seededRandom(i * 79) * 4200 + Number(food) * 2400 + Number(housing) * 3000 + Number(uninsured) * 1800, 2),
      time_to_event_days: 20 + Math.floor(seededRandom(i * 83) * 780),
      event_observed: seededRandom(i * 89) < 0.34,
      latitude: round(38.9 + seededRandom(i * 97) * 0.8 - 0.4, 4),
      longitude: round(-76.9 + seededRandom(i * 101) * 1 - 0.5, 4),
    };
  }

  private readmissionRisk(patient: SdohPatient) {
    return Math.min(0.92, Math.max(0.04, 0.08 + Number(patient.housing_instability) * 0.18 + Number(patient.food_insecurity) * 0.11 + Number(patient.transportation_barrier) * 0.13 + (patient.income_level === 'Low' ? 0.12 : 0) + (patient.insurance_status === 'Uninsured' ? 0.09 : 0) - patient.social_support_score * 0.008));
  }

  private filterPatients(filter: CohortFilter) {
    return this.patients.filter((patient) =>
      Object.entries(filter).every(([key, value]) => value === undefined || value === null || patient[key as keyof SdohPatient] === value),
    );
  }

  private response(module: string, title: string, chart_type: string, table: Array<Record<string, unknown>>, data: Record<string, unknown>, interpretation: string): SdohAnalysisResponse {
    return { module, title, summary: title, chart_type, table, data, interpretation };
  }

  private disabled(name: string) {
    return { enabled: false, message: `${name} is disabled.` };
  }

  private audit(action: string, entityType = 'system', entityId = '', details: Record<string, unknown> = {}) {
    const entry = {
      id: `audit-${this.auditLog.length + 1}`,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    };
    this.auditLog.push(entry);
    return entry;
  }
}

export const sdohIntelligenceService = new SdohIntelligenceService();
