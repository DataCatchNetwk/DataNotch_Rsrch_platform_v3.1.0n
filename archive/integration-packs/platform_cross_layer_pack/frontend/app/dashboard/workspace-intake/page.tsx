import { StagePage } from '../../../components/platform/StagePage';

export default function WorkspaceIntakePage() {
  return <StagePage
    active="workspace-intake"
    title="Workspace Intake"
    subtitle="Upload ZIP/folders/files, extract archives, preview workspace assets, create projects/tasks, assign teams, and register dataset candidates."
    nextLabel="Data Management"
    nextHref="/dashboard/data-management"
    metrics={[{label:'Uploaded archives', value:8, note:'3 extracted today'}, {label:'Detected datasets', value:21, note:'CSV/XLSX/Parquet'}, {label:'Open tasks', value:14, note:'intake queue'}, {label:'Ready for registry', value:9, note:'candidate files'}]}
    worklistTitle="Workspace Intake Worklist"
    worklist={[{asset:'ACS_SDOH.zip', type:'Archive', status:'Extracted', action:'Register 3 datasets'}, {asset:'heart_failure.xlsx', type:'Excel', status:'Detected', action:'Preview'}, {asset:'codebook.pdf', type:'Document', status:'Indexed', action:'Attach metadata'}]}
    primaryActions={[{title:'Upload ZIP or Folder', description:'Upload a research package and safely extract it into workspace storage.', href:'/dashboard/files'}, {title:'Create Project', description:'Create a project from selected workspace files and assign a team.', href:'/dashboard/projects'}, {title:'Register Dataset', description:'Move detected CSV/XLSX/Parquet files to Raw Dataset Registry.', href:'/dashboard/data-management?stage=registry'}]}
    uniquePanel={<div className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Workspace File Explorer</h2><div className="mt-4 grid md:grid-cols-3 gap-3 text-sm"><div className="rounded-xl border p-4">📦 ACS_SDOH.zip<br/><span className="text-slate-500">Extracted folder</span></div><div className="rounded-xl border p-4">📄 census.csv<br/><span className="text-slate-500">Dataset candidate</span></div><div className="rounded-xl border p-4">📘 codebook.pdf<br/><span className="text-slate-500">Metadata document</span></div></div></div>}
  />;
}
