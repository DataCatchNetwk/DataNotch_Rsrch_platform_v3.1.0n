import { DataGrid } from '@/components/data-deposit/data-grid'

export default function DataDepositPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Central Data Deposit</h1>
        <p className="text-sm text-muted-foreground">
          Discover curated datasets by domain, preview records, and pull approved data into your workspace.
        </p>
      </div>
      <DataGrid />
    </div>
  )
}
