import type { ParsedDataProfile } from './universal-data-parser.service.js';

type DataType = 'number' | 'date' | 'boolean' | 'categorical' | 'text' | 'unknown';

type SchemaColumn = {
  name: string;
  type?: string;
  nullable?: boolean;
};

type ColumnProfile = {
  originalName: string;
  standardName: string;
  inferredType: DataType;
  role: 'outcome' | 'predictor' | 'grouping' | 'time' | 'identifier';
  missingCount: number;
  missingRate: number;
  uniqueCount: number;
  outlierCount: number;
  sampleValues: unknown[];
};

export type DataPreparationReport = {
  engine: 'DataPreparationEngine';
  status: 'ANALYSIS_READY' | 'REVIEW_REQUIRED';
  profile: {
    rows: number;
    columns: number;
    totalMissingValues: number;
    missingRate: number;
    duplicateRows: number;
    outlierCount: number;
    qualityScore: number;
    numericColumns: string[];
    categoricalColumns: string[];
    dateColumns: string[];
  };
  cleaningLog: string[];
  columnProfiles: ColumnProfile[];
  variableMapping: Array<{
    originalName: string;
    standardName: string;
    type: DataType;
    role: ColumnProfile['role'];
  }>;
  cleanedPreviewRows: Array<Record<string, unknown>>;
  recommendations: {
    researchQuestionBuilder: string[];
    hypothesisSelector: string[];
    statistics: string[];
    visualizations: string[];
    publicationCharts: string[];
  };
  createdAt: string;
};

const MISSING_MARKERS = new Set(['', 'na', 'n/a', 'null', 'none', 'undefined', 'missing', '.']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isMissing(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  return MISSING_MARKERS.has(value.trim().toLowerCase());
}

function standardizeColumnName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[%]/g, 'pct')
    .replace(/[#]/g, 'number')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_') || 'field';
}

function normalizeDateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    return value;
  }
  const text = String(value).trim();
  if (/^\d{4}$/.test(text)) return text;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return value;
}

function coerceValue(value: unknown, type: DataType) {
  if (isMissing(value)) return null;

  if (type === 'number' && typeof value !== 'boolean') {
    const numeric = Number(String(value).replace(/[$,%\s,]/g, ''));
    return Number.isFinite(numeric) ? numeric : value;
  }

  if (type === 'boolean') {
    const text = String(value).trim().toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(text)) return true;
    if (['false', 'no', 'n', '0'].includes(text)) return false;
  }

  if (type === 'date') {
    return normalizeDateValue(value);
  }

  return value;
}

function inferType(values: unknown[], schemaType?: string): DataType {
  const declared = String(schemaType ?? '').toLowerCase();
  if (/int|float|double|decimal|numeric|number|real/.test(declared)) return 'number';
  if (/date|time|year/.test(declared)) return 'date';
  if (/bool/.test(declared)) return 'boolean';

  const present = values.filter((value) => !isMissing(value)).slice(0, 100);
  if (!present.length) return 'unknown';

  const numericRatio = present.filter((value) => {
    if (typeof value === 'boolean') return false;
    return Number.isFinite(Number(String(value).replace(/[$,%\s,]/g, '')));
  }).length / present.length;

  if (numericRatio >= 0.85) return 'number';

  const boolRatio = present.filter((value) => ['true', 'false', 'yes', 'no', 'y', 'n', '0', '1'].includes(String(value).trim().toLowerCase())).length / present.length;
  if (boolRatio >= 0.85) return 'boolean';

  const dateRatio = present.filter((value) => {
    const text = String(value).trim();
    return /^\d{4}$/.test(text) || !Number.isNaN(new Date(text).getTime());
  }).length / present.length;
  if (dateRatio >= 0.75) return 'date';

  const uniqueCount = new Set(present.map((value) => String(value))).size;
  return uniqueCount <= Math.max(20, present.length * 0.35) ? 'categorical' : 'text';
}

function suggestRole(name: string, type: DataType): ColumnProfile['role'] {
  const lower = name.toLowerCase();
  if (/^(id|uuid|guid)$|_id$|identifier|patient_id|subject_id/.test(lower)) return 'identifier';
  if (/outcome|status|readmit|mortality|death|risk|score|cost|survival|event/.test(lower)) return 'outcome';
  if (/date|time|year|month|day|visit|follow_up/.test(lower) || type === 'date') return 'time';
  if (/county|zip|gender|race|ethnicity|income|education|insurance|group|cohort|category/.test(lower) || type === 'categorical') return 'grouping';
  return 'predictor';
}

function countOutliers(values: unknown[]) {
  const numbers = values
    .filter((value) => !isMissing(value))
    .map((value) => Number(String(value).replace(/[$,%\s,]/g, '')))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (numbers.length < 8) return 0;

  const q = (p: number) => numbers[Math.min(numbers.length - 1, Math.max(0, Math.floor((numbers.length - 1) * p)))] ?? 0;
  const q1 = q(0.25);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  if (iqr === 0) return 0;
  const min = q1 - 1.5 * iqr;
  const max = q3 + 1.5 * iqr;
  return numbers.filter((value) => value < min || value > max).length;
}

function uniqueStandardName(base: string, used: Set<string>) {
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

function buildRecommendations(columns: ColumnProfile[]) {
  const hasOutcome = columns.some((column) => column.role === 'outcome');
  const hasNumeric = columns.some((column) => column.inferredType === 'number');
  const hasCategorical = columns.some((column) => column.inferredType === 'categorical' || column.role === 'grouping');
  const hasDate = columns.some((column) => column.inferredType === 'date' || column.role === 'time');

  return {
    researchQuestionBuilder: [
      'Describe the cohort and missingness profile.',
      hasOutcome ? 'Identify predictors associated with the primary outcome.' : 'Select an outcome variable before predictive modeling.',
      hasCategorical ? 'Compare outcomes across demographic or SDOH groups.' : 'Add grouping variables for equity comparisons.',
    ],
    hypothesisSelector: [
      hasCategorical && hasNumeric ? 'Group comparison: t-test, ANOVA, Mann-Whitney U, or Kruskal-Wallis.' : 'Foundational descriptive statistics.',
      hasOutcome ? 'Outcome association: chi-square, logistic regression, or survival model.' : 'Exploratory profiling until an outcome is selected.',
      hasDate ? 'Temporal trend hypothesis: time-series or longitudinal analysis.' : 'Cross-sectional hypothesis testing.',
    ],
    statistics: [
      'Descriptive Statistics',
      hasNumeric ? 'Correlation Analysis' : 'Frequency Tables',
      hasOutcome ? 'Regression Analytics' : 'Missingness Analysis',
      hasOutcome ? 'Classification Models' : 'Variable Mapping',
      hasDate ? 'Time-Series Analytics' : 'Cohort Profiling',
    ],
    visualizations: [
      'Missingness Heatmap',
      hasNumeric ? 'Histogram' : 'Bar Chart',
      hasCategorical ? 'Stacked Bar Chart' : 'Column Profile Table',
      hasOutcome ? 'Forest Plot' : 'Data Quality Matrix',
      hasDate ? 'Line Chart' : 'Box Plot',
    ],
    publicationCharts: ['Table 1', 'Data Quality Appendix', hasOutcome ? 'Model Result Table' : 'Variable Dictionary', hasOutcome ? 'Figure 1' : 'Cohort Flow Diagram'],
  };
}

export class DataPreparationEngine {
  prepare(profile: ParsedDataProfile): DataPreparationReport {
    const previewRows = Array.isArray(profile.previewRowsJson)
      ? profile.previewRowsJson.filter(isRecord)
      : [];
    const schema = Array.isArray(profile.schemaJson) ? (profile.schemaJson as SchemaColumn[]) : [];
    const schemaNames = schema.map((column) => column.name).filter(Boolean);
    const rowNames = previewRows.length ? Object.keys(previewRows[0] ?? {}) : [];
    const columns = Array.from(new Set([...schemaNames, ...rowNames]));
    const usedNames = new Set<string>();

    const columnProfiles = columns.map((name) => {
      const schemaColumn = schema.find((column) => column.name === name);
      const values = previewRows.map((row) => row[name]);
      const presentValues = values.filter((value) => !isMissing(value));
      const inferredType = inferType(values, schemaColumn?.type);
      const standardName = uniqueStandardName(standardizeColumnName(name), usedNames);
      const missingCount = values.length ? values.length - presentValues.length : schemaColumn?.nullable ? 1 : 0;

      return {
        originalName: name,
        standardName,
        inferredType,
        role: suggestRole(standardName, inferredType),
        missingCount,
        missingRate: values.length ? missingCount / values.length : 0,
        uniqueCount: new Set(presentValues.map((value) => String(value))).size,
        outlierCount: inferredType === 'number' ? countOutliers(values) : 0,
        sampleValues: presentValues.slice(0, 5),
      };
    });

    const duplicateRows = previewRows.length - new Set(previewRows.map((row) => JSON.stringify(row))).size;
    const profiledRows = previewRows.length || Number(profile.recordCount ?? 0);
    const totalCells = Math.max(1, profiledRows * Math.max(1, columns.length));
    const totalMissingValues = columnProfiles.reduce((sum, column) => sum + column.missingCount, 0);
    const outlierCount = columnProfiles.reduce((sum, column) => sum + column.outlierCount, 0);
    const missingRate = totalMissingValues / totalCells;
    const duplicateRate = previewRows.length ? duplicateRows / previewRows.length : 0;
    const qualityScore = Math.max(0, Math.min(100, Math.round(100 - missingRate * 55 - duplicateRate * 25 - Math.min(outlierCount, 50) * 0.3)));

    const cleanedPreviewRows = previewRows.slice(0, 50).map((row) => {
      const cleaned: Record<string, unknown> = {};
      for (const column of columnProfiles) {
        cleaned[column.standardName] = coerceValue(row[column.originalName], column.inferredType);
      }
      return cleaned;
    });

    const cleaningLog = [
      'Profiled schema, preview rows, missingness, duplicates, data types, and outliers.',
      'Standardized column names for analysis-safe downstream use.',
      'Prepared cleaned preview rows with missing-value normalization and type coercion.',
      'Generated variable mapping, research question suggestions, hypothesis selectors, and visualization routing.',
    ];

    if (duplicateRows > 0) cleaningLog.push(`Detected ${duplicateRows} duplicate preview rows for review.`);
    if (totalMissingValues > 0) cleaningLog.push(`Detected ${totalMissingValues} missing preview values for imputation or exclusion policy.`);
    if (outlierCount > 0) cleaningLog.push(`Detected ${outlierCount} numeric outlier candidates for sensitivity analysis.`);

    return {
      engine: 'DataPreparationEngine',
      status: qualityScore >= 60 && columns.length > 0 ? 'ANALYSIS_READY' : 'REVIEW_REQUIRED',
      profile: {
        rows: Number(profile.recordCount ?? previewRows.length ?? 0),
        columns: Number(profile.columnCount ?? columns.length ?? 0),
        totalMissingValues,
        missingRate,
        duplicateRows,
        outlierCount,
        qualityScore,
        numericColumns: columnProfiles.filter((column) => column.inferredType === 'number').map((column) => column.standardName),
        categoricalColumns: columnProfiles.filter((column) => column.inferredType === 'categorical').map((column) => column.standardName),
        dateColumns: columnProfiles.filter((column) => column.inferredType === 'date').map((column) => column.standardName),
      },
      cleaningLog,
      columnProfiles,
      variableMapping: columnProfiles.map((column) => ({
        originalName: column.originalName,
        standardName: column.standardName,
        type: column.inferredType,
        role: column.role,
      })),
      cleanedPreviewRows,
      recommendations: buildRecommendations(columnProfiles),
      createdAt: new Date().toISOString(),
    };
  }
}
