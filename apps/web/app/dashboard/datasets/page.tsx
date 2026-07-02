import { DatasetsFlowShell } from "@/components/datasets/datasets-flow-shell"
import {
  DatasetLifecycleModulePage,
  type DatasetLifecycleStage,
} from "@/components/research/dataset-lifecycle-module-page"
import { ResearchLifecycleStagePage } from "@/components/research/research-lifecycle-stage-page"
import { lifecyclePages } from "@/src/config/research-lifecycle-pages"

type DatasetsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DatasetsPage({ searchParams }: DatasetsPageProps) {
  const params = await searchParams
  const view = first(params?.view)
  const prep = first(params?.prep)
  const datasetStage = asDatasetLifecycleStage(view) ?? asDatasetLifecycleStage(prep)

  if (datasetStage) {
    return <DatasetLifecycleModulePage stage={datasetStage} />
  }

  const lifecyclePage = (view && lifecyclePages[view]) || (prep && lifecyclePages[prep])

  if (lifecyclePage) {
    return <ResearchLifecycleStagePage config={lifecyclePage} />
  }

  return <DatasetsFlowShell />
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function asDatasetLifecycleStage(value: string | undefined): DatasetLifecycleStage | null {
  if (
    value === "raw" ||
    value === "clean" ||
    value === "harmonized" ||
    value === "features" ||
    value === "lineage" ||
    value === "catalog" ||
    value === "profiling" ||
    value === "cleaning" ||
    value === "harmonization" ||
    value === "quality" ||
    value === "versions"
  ) {
    return value
  }

  return null
}
