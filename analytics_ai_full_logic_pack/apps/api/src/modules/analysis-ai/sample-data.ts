export type Row = Record<string, any>;

export function demoRows(): Row[] {
  const incomes = ['Low', 'Medium', 'High'];
  const counties = ['Baltimore City', 'Montgomery', "Prince George's", 'District of Columbia'];
  const rows: Row[] = [];
  for (let i = 0; i < 600; i++) {
    const age = 18 + ((i * 7) % 72);
    const housing = i % 3 === 0 ? 1 : 0;
    const food = i % 4 === 0 ? 1 : 0;
    const transport = i % 5 === 0 ? 1 : 0;
    const income = incomes[i % incomes.length];
    const risk = 0.08 + housing * 0.18 + food * 0.1 + transport * 0.06 + (income === 'Low' ? 0.12 : income === 'Medium' ? 0.05 : 0) + (age > 65 ? 0.09 : 0);
    rows.push({
      patient_id: `P-${String(i + 1).padStart(5, '0')}`,
      age,
      income_level: income,
      housing_instability: housing,
      food_access: food ? 'Low' : 'Adequate',
      transportation_barrier: transport,
      insurance_type: i % 2 === 0 ? 'Medicaid' : 'Private',
      county: counties[i % counties.length],
      readmission_30d: risk > 0.33 ? 1 : 0,
      mortality: risk > 0.48 ? 1 : 0,
      followup_days: 30 + ((i * 13) % 500),
      cost: Math.round(1200 + risk * 9000 + age * 11),
      risk_score: Number(Math.min(0.95, risk).toFixed(3)),
    });
  }
  return rows;
}
