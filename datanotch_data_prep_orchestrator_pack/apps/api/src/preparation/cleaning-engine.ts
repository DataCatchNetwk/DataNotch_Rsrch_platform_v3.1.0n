export type ProfileReport = {
  rowCount: number;
  columnCount: number;
  columns: Array<{ name: string; type: string; missing: number; unique: number }>;
  duplicateRows: number;
  piiRiskColumns: string[];
  qualityScore: number;
  recommendations: string[];
};

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function inferType(values: string[]) {
  const nonEmpty = values.filter(v => v !== '' && v != null);
  if (!nonEmpty.length) return 'empty';
  const numeric = nonEmpty.every(v => !Number.isNaN(Number(v)));
  if (numeric) return 'number';
  const dates = nonEmpty.every(v => !Number.isNaN(Date.parse(v)));
  if (dates) return 'date';
  return 'string';
}

export function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map(normalizeName);
  return lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]));
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') quoted = !quoted;
    else if (c === ',' && !quoted) { out.push(cur.replace(/^"|"$/g, '')); cur = ''; }
    else cur += c;
  }
  out.push(cur.replace(/^"|"$/g, ''));
  return out;
}

export function profileRows(rows: Record<string, string>[]): ProfileReport {
  const headers = Object.keys(rows[0] || {});
  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    const sig = JSON.stringify(row);
    if (seen.has(sig)) duplicates++;
    seen.add(sig);
  }
  const piiPatterns = /(email|phone|ssn|social_security|address|dob|birth|patient_name|mrn)/i;
  const columns = headers.map(name => {
    const values = rows.map(r => r[name] ?? '');
    return {
      name,
      type: inferType(values),
      missing: values.filter(v => v === '').length,
      unique: new Set(values).size,
    };
  });
  const missingTotal = columns.reduce((a, c) => a + c.missing, 0);
  const cells = Math.max(rows.length * Math.max(headers.length, 1), 1);
  const piiRiskColumns = headers.filter(h => piiPatterns.test(h));
  const qualityScore = Math.max(0, Math.round(100 - (missingTotal / cells) * 40 - (duplicates / Math.max(rows.length, 1)) * 30 - piiRiskColumns.length * 3));
  const recommendations = [
    'Normalize column names',
    duplicates ? 'Review duplicate rows before removal' : 'No duplicate removal required',
    missingTotal ? 'Review missing values and approve imputation/drop strategy' : 'No missing-value action required',
    piiRiskColumns.length ? 'PII/PHI risk detected; route to reviewer before analytics' : 'No obvious PII/PHI risk detected',
  ];
  return { rowCount: rows.length, columnCount: headers.length, columns, duplicateRows: duplicates, piiRiskColumns, qualityScore, recommendations };
}

export function cleanRows(rows: Record<string, string>[]) {
  const cleaned = rows.map(row => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      const key = normalizeName(k);
      let value = String(v ?? '').trim();
      if (!Number.isNaN(Date.parse(value)) && /date|time|dob|created|updated/.test(key)) {
        value = new Date(value).toISOString().slice(0, 10);
      }
      out[key] = value;
    }
    return out;
  });
  const seen = new Set<string>();
  return cleaned.filter(row => {
    const sig = JSON.stringify(row);
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

export function toCsv(rows: Record<string, string>[]) {
  const headers = Object.keys(rows[0] || {});
  const esc = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h] ?? '')).join(','))].join('\n');
}
