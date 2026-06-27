import { DatasetDetailsPage } from "@/components/datasets/dataset-details-page"

export default async function DatasetDetailsRoute({
  params,
}: {
  params: Promise<{ datasetId: string }>
}) {
  const { datasetId } = await params
  return <DatasetDetailsPage datasetId={datasetId} />
}
