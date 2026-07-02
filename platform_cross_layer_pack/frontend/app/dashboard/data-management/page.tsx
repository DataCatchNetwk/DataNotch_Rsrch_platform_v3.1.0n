import { StagePage } from '../../../components/platform/StagePage';

export default function DataManagementPage() {
  return <StagePage
    active="data-management"
    title="Data Management"
    subtitle="Centralize raw files, sources, database workbench outputs, dataset registry stages, lineage, and searchable catalog assets."
    nextLabel="Data Preparation"
    nextHref="/dashboard/data-preparation"
    metrics={[{label:'Raw datasets', value:392}, {label:'Clean datasets', value:214}, {label:'Harmonized', value:126}, {label:'Feature sets', value:115}]}
    worklistTitle="Dataset Registry Queue"
    worklist={[{dataset:'ACS SDOH Census', stage:'Raw', quality:'82%', status:'Profile next'}, {dataset:'Heart Failure Readmission', stage:'Clean', quality:'91%', status:'Harmonize'}, {dataset:'FHIR Claims Merge', stage:'Harmonized', quality:'94%', status:'Feature engineering'}]}
    primaryActions={[{title:'Open Raw File Library', description:'Inspect uploaded assets and register eligible dataset files.', href:'/dashboard/files'}, {title:'Open Database Studio', description:'Query connected databases and create governed datasets.', href:'/dashboard/database'}, {title:'Open Dataset Registry', description:'Manage raw, clean, harmonized, feature, and lineage dataset states.', href:'/dashboard/datasets'}]}
    uniquePanel={<div className="grid lg:grid-cols-3 gap-4"><div className="rounded-3xl border bg-white p-6"><h3 className="font-bold">Data Sources</h3><p className="text-sm text-slate-600 mt-2">Connected: PostgreSQL, Snowflake, BigQuery, FHIR, Neo4j.</p></div><div className="rounded-3xl border bg-white p-6"><h3 className="font-bold">Registry Flow</h3><p className="text-sm text-slate-600 mt-2">Raw → Clean → Harmonized → Feature Set → Lineage.</p></div><div className="rounded-3xl border bg-white p-6"><h3 className="font-bold">Catalog</h3><p className="text-sm text-slate-600 mt-2">Search by owner, domain, variables, quality, tags, and publications.</p></div></div>}
  />;
}
