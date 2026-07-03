import { DatasetColumnProfile, PreparationDataset } from './data-preparation.types';

function isMissing(value: unknown): boolean {
  return value === null || value === undefined || value === '' || value === 'NA' || value === 'N/A';
}

function inferType(values: unknown[]): DatasetColumnProfile['type'] {
  const present = values.filter((v) => !isMissing(v));
  if (!present.length) return 'text';
  const numeric = present.filter((v) => Number.isFinite(Number(v))).length / present.length;
  if (numeric > 0.85) return 'numeric';
  const bool = present.filter((v) => ['true', 'false', true, false, 0, 1, '0', '1'].includes(v as any)).length / present.length;
  if (bool > 0.85) return 'boolean';
  const dates = present.filter((v) => !Number.isNaN(Date.parse(String(v)))).length / present.length;
  if (dates > 0.85) return 'date';
  const uniqueRate = new Set(present.map(String)).size / present.length;
  return uniqueRate < 0.35 ? 'categorical' : 'text';
}

function quantile(xs: number[], q: number): number {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
}

export function profileDataset(dataset: PreparationDataset) {
  const columns = Array.from(new Set(dataset.rows.flatMap((row) => Object.keys(row))));
  const profiles: DatasetColumnProfile[] = columns.map((name) => {
    const values = dataset.rows.map((row) => row[name]);
    const missingCount = values.filter(isMissing).length;
    const present = values.filter((v) => !isMissing(v));
    const type = inferType(values);
    const uniqueCount = new Set(present.map(String)).size;
    const profile: DatasetColumnProfile = {
      name,
      type,
      missingCount,
      missingRate: values.length ? missingCount / values.length : 0,
      uniqueCount,
      uniqueRate: present.length ? uniqueCount / present.length : 0,
    };

    if (type === 'numeric') {
      const nums = present.map(Number).filter(Number.isFinite);
      const mean = nums.reduce((a, b) => a + b, 0) / Math.max(nums.length, 1);
      const variance = nums.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / Math.max(nums.length - 1, 1);
      profile.mean = Number(mean.toFixed(4));
      profile.median = Number(quantile(nums, 0.5).toFixed(4));
      profile.min = Math.min(...nums);
      profile.max = Math.max(...nums);
      profile.std = Number(Math.sqrt(variance).toFixed(4));
    } else {
      const counts = new Map<string, number>();
      present.forEach((v) => counts.set(String(v), (counts.get(String(v)) || 0) + 1));
      profile.topValues = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    }
    return profile;
  });

  const missingCells = profiles.reduce((sum, p) => sum + p.missingCount, 0);
  const totalCells = Math.max(dataset.rows.length * Math.max(columns.length, 1), 1);
  const duplicateRows = dataset.rows.length - new Set(dataset.rows.map((r) => JSON.stringify(r))).size;

  return {
    rows: dataset.rows.length,
    columns: columns.length,
    missingRate: missingCells / totalCells,
    duplicateRows,
    profiles,
    qualityScore: Math.max(0, Math.round(100 - (missingCells / totalCells) * 60 - (duplicateRows / Math.max(dataset.rows.length, 1)) * 40)),
  };
}
