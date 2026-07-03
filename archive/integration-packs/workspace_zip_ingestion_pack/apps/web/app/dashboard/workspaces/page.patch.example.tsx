// Example integration inside your existing Workspace page/card detail.
// Import and render this component after the workspace card list or inside Open Workspace view.

import WorkspaceFileExplorer from './WorkspaceFileExplorer';

export default function WorkspaceDetailPageExample() {
  const activeWorkspaceId = 'replace-with-selected-workspace-id';

  return (
    <main className="space-y-6 p-6">
      {/* Existing workspace summary/card remains here */}
      <WorkspaceFileExplorer workspaceId={activeWorkspaceId} />
    </main>
  );
}
