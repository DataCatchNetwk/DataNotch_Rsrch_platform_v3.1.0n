import { PreparationDataset } from './data-preparation.types';
import { profileDataset } from './profiling.engine';

function isMissing(value: unknown): boolean {
  return value === null || value === undefined || value === '' || value === 'NA' || value === 'N/A';
}

function median(nums: number[]) {
  const sorted = [...nums].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mode(values: unknown[]) {
  const counts = new Map<string, number>();
  values.filter((v) => !isMissing(v)).forEach((v) => counts.set(String(v), (counts.get(String(v)) || 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

export function cleanDataset(dataset: PreparationDataset) {
  const before = profileDataset(dataset);
  const profiles = before.profiles;
  const replacements: Record<string, unknown> = {};

  for (const p of profiles) {
    const values = dataset.rows.map((row) => row[p.name]).filter((v) => !isMissing(v));
    if (p.type === 'numeric') replacements[p.name] = median(values.map(Number).filter(Number.isFinite));
    else replacements[p.name] = mode(values);
  }

  const seen = new Set<string>();
  const cleanedRows = dataset.rows
    .map((row) => {
      const next: Record<string, unknown> = {};
      for (const p of profiles) {
        let value = row[p.name];
        if (isMissing(value)) value = replacements[p.name];

        if (p.type === 'numeric') value = Number(value);
        if (p.type === 'boolean') value = ['true', true, 1, '1', 'yes', 'Yes'].includes(value as any);
        if (typeof value === 'string') value = value.trim();

        next[p.name] = value;
      }
      return next;
    })
    .filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const after = profileDataset({ ...dataset, rows: cleanedRows });

  return {
    dataset: { ...dataset, id: `${dataset.id}-clean`, name: `${dataset.name} Clean`, rows: cleanedRows, sourceStage: 'cleaning' },
    before,
    after,
    rulesApplied: [
      'median imputation for numeric columns',
      'mode imputation for categorical/text columns',
      'type normalization',
      'string trimming',
      'duplicate row removal',
    ],
  };
}
