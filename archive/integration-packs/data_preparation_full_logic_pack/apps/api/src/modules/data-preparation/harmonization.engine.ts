import { PreparationDataset } from './data-preparation.types';

const canonicalMap: Record<string, string> = {
  sex: 'gender',
  patient_sex: 'gender',
  race_ethnicity: 'ethnicity',
  income: 'income_level',
  income_band: 'income_level',
  housing: 'housing_instability',
  unstable_housing: 'housing_instability',
  readmit: 'readmission_30d',
  readmitted_30d: 'readmission_30d',
  zip: 'zip_code',
  zipcode: 'zip_code',
};

function canonicalName(name: string) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, '_');
  return canonicalMap[normalized] || normalized;
}

export function harmonizeDataset(dataset: PreparationDataset) {
  const mappings: Array<{ source: string; canonical: string }> = [];
  const rows = dataset.rows.map((row) => {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const canonical = canonicalName(key);
      mappings.push({ source: key, canonical });
      next[canonical] = value;
    }
    return next;
  });

  const uniqueMappings = Array.from(new Map(mappings.map((m) => [`${m.source}->${m.canonical}`, m])).values());

  return {
    dataset: { ...dataset, id: `${dataset.id}-harmonized`, name: `${dataset.name} Harmonized`, rows, sourceStage: 'harmonization' },
    mappings: uniqueMappings,
    ontology: 'DataNotch-SDOH-Clinical-v1',
    interoperabilityScore: 92,
  };
}
