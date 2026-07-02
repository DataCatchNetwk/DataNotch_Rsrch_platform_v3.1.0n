import { StagePage } from '@/components/platform/stage-page';

export default function DataManagementPage() {
  return (
    <StagePage
      active="data-management"
      title="Data Management"
      subtitle="Classify, register, catalog, and route datasets from raw intake through clean, harmonized, and feature-ready states."
      nextLabel="Data Preparation"
      nextHref="/dashboard/data-preparation"
      metrics={[
        { label: 'Raw Datasets', value: 392 },
        { label: 'Clean Datasets', value: 214 },
        { label: 'Harmonized Sets', value: 126 },
        { label: 'Feature Sets', value: 115 },
      ]}
      worklistTitle="Dataset Registry Queue"
      worklist={[
        { dataset: 'ACS SDOH Census', stage: 'Raw', quality: '82%', status: 'Profile next' },
        { dataset: 'Heart Failure Readmission', stage: 'Clean', quality: '91%', status: 'Harmonize' },
        { dataset: 'FHIR Claims Merge', stage: 'Harmonized', quality: '94%', status: 'Engineer features' },
      ]}
      primaryActions={[
        { title: 'Raw File Library', description: 'Inspect intake files and register candidates.', href: '/dashboard/files' },
        { title: 'Data Sources', description: 'Manage source connections and import jobs.', href: '/dashboard/data-sources' },
        { title: 'Dataset Registry', description: 'Track raw-to-feature lifecycle stages.', href: '/dashboard/datasets' },
      ]}
      uniquePanel={
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border bg-white p-6 shadow-sm"><h3 className="font-bold">Data Sources</h3><p className="mt-2 text-sm text-slate-600">PostgreSQL, Snowflake, BigQuery, FHIR, Neo4j, MongoDB.</p></div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm"><h3 className="font-bold">Registry Flow</h3><p className="mt-2 text-sm text-slate-600">Raw → Clean → Harmonized → Feature Set → Lineage.</p></div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm"><h3 className="font-bold">Data Catalog</h3><p className="mt-2 text-sm text-slate-600">Search by owner, domain, quality, variables, tags, and publications.</p></div>
        </div>
      }
    />
  );
}
