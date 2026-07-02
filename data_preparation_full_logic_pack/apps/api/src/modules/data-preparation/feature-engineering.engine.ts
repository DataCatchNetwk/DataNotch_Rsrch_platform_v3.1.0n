import { PreparationDataset } from './data-preparation.types';

function asNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function boolScore(value: unknown) {
  return ['yes', 'true', true, 1, '1', 'low'].includes(String(value).toLowerCase()) ? 1 : 0;
}

export function engineerFeatures(dataset: PreparationDataset) {
  const rows = dataset.rows.map((row) => {
    const age = asNumber(row.age);
    const housing = boolScore(row.housing_instability);
    const food = boolScore(row.food_insecurity);
    const transport = boolScore(row.transportation_barrier);
    const incomeLow = String(row.income_level || '').toLowerCase() === 'low' ? 1 : 0;
    const insuranceGap = boolScore(row.insurance_gap);

    const sdohBurdenScore = housing + food + transport + incomeLow + insuranceGap;
    const ageRiskBand = age >= 75 ? 'high' : age >= 60 ? 'medium' : 'low';
    const readmissionRiskIndex = Math.min(1, 0.08 + sdohBurdenScore * 0.11 + (age >= 65 ? 0.14 : 0));

    return {
      ...row,
      sdoh_burden_score: sdohBurdenScore,
      age_risk_band: ageRiskBand,
      readmission_risk_index: Number(readmissionRiskIndex.toFixed(4)),
      housing_income_interaction: housing * incomeLow,
    };
  });

  return {
    dataset: { ...dataset, id: `${dataset.id}-features`, name: `${dataset.name} Feature Set`, rows, sourceStage: 'feature-engineering' },
    featureSets: [
      { name: 'SDOH Burden Score', variables: ['housing_instability', 'food_insecurity', 'transportation_barrier', 'income_level', 'insurance_gap'] },
      { name: 'Readmission Risk Index', variables: ['age', 'sdoh_burden_score'] },
      { name: 'Housing-Income Interaction', variables: ['housing_instability', 'income_level'] },
    ],
  };
}
