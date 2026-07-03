import { StagePage } from '../../../components/platform/StagePage';

export default function DataPreparationPage() {
  return <StagePage
    active="data-preparation"
    title="Data Preparation"
    subtitle="Run advanced profiling, missingness detection, deduplication, type normalization, harmonization, feature engineering, quality scoring, and dataset versioning."
    nextLabel="Research Studio"
    nextHref="/dashboard/research-studio"
    metrics={[{label:'Rules configured', value:24}, {label:'Eligible records', value:'12.8k'}, {label:'Quality score', value:'94%'}, {label:'Version', value:'v3.2'}]}
    worklistTitle="Preparation Pipeline"
    worklist={[{step:'Profiling', algorithm:'missingness/outlier/type scan', result:'7.4% missing'}, {step:'Cleaning', algorithm:'median/mode imputation + dedupe', result:'312 duplicates removed'}, {step:'Harmonization', algorithm:'ontology + synonym mapping', result:'64 fields mapped'}, {step:'Features', algorithm:'risk scores + ratios + interactions', result:'236 features'}, {step:'Validation', algorithm:'completeness/validity/uniqueness', result:'94%'}]}
    primaryActions={[{title:'Run Full Prep Pipeline', description:'Profile → Clean → Harmonize → Engineer → Validate → Version.', href:'/dashboard/data-preparation?action=run'}, {title:'Preview Changes', description:'Compare before/after data quality and schema drift.', href:'/dashboard/data-preparation?action=preview'}, {title:'Save Prepared Version', description:'Create a versioned dataset for Research Studio.', href:'/dashboard/datasets?view=versions'}]}
    uniquePanel={<div className="rounded-3xl border bg-white p-6"><h2 className="text-xl font-bold">Algorithmic Preparation Logic</h2><div className="mt-4 grid md:grid-cols-3 gap-3 text-sm"><div className="rounded-xl border p-4">Missingness: MCAR/MAR flags, imputation policy</div><div className="rounded-xl border p-4">Outliers: IQR/Z-score winsorization</div><div className="rounded-xl border p-4">Harmonization: canonical variables + ontology map</div></div></div>}
  />;
}
