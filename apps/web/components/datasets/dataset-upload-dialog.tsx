"use client"

import * as React from "react"
import {
  Archive,
  CheckCircle2,
  Cloud,
  Database,
  FileStack,
  FolderUp,
  Loader2,
  UploadCloud,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUploadDataset } from "@/hooks/use-upload-dataset"
import {
  type DatasetUploadKind,
  getSavedDatasetWorkspaceId,
  listUploadWorkspaces,
  saveDatasetWorkspaceId,
} from "@/lib/api/datasets"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  name: z.string().min(2, "Dataset name is required"),
  description: z.string().optional(),
  visibility: z.enum(["PRIVATE", "TEAM", "PUBLIC", "RESTRICTED"]),
  workspaceId: z.string().min(1, "Choose a workspace"),
  sourceProvider: z.string().optional(),
  sourceLocator: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const uploadMethods: Array<{
  kind: DatasetUploadKind
  title: string
  description: string
  icon: React.ElementType
}> = [
  {
    kind: "files",
    title: "Upload Files",
    description: "CSV, XLSX, JSON, TSV, NIfTI, VCF, PDF, and research files.",
    icon: FileStack,
  },
  {
    kind: "folder",
    title: "Upload Folder",
    description: "Preserve ADNI/OpenNeuro-style folder structure and subfolders.",
    icon: FolderUp,
  },
  {
    kind: "zip",
    title: "Upload ZIP",
    description: "Queue archive extraction, inventory, validation, and registry.",
    icon: Archive,
  },
  {
    kind: "cloud",
    title: "Import Cloud",
    description: "Register Google Drive, OneDrive, Dropbox, S3, or Azure folders.",
    icon: Cloud,
  },
  {
    kind: "repository",
    title: "Import Repository",
    description: "Register OpenNeuro, ADNI, PPMI, UK Biobank, or similar datasets.",
    icon: Database,
  },
]

function getRelativePath(file: File) {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function detectModality(path: string) {
  const value = path.toLowerCase()
  if (value.endsWith(".nii") || value.endsWith(".nii.gz")) {
    if (value.includes("dti")) return "DTI"
    if (value.includes("fmri") || value.includes("bold")) return "fMRI"
    return "MRI"
  }
  if (value.endsWith(".vcf") || value.endsWith(".bcf")) return "Genomics"
  if (value.endsWith(".csv") || value.endsWith(".tsv") || value.endsWith(".xlsx")) return "Clinical/Tabular"
  if (value.endsWith(".json")) return value.includes("metadata") ? "Metadata" : "JSON"
  if (value.endsWith(".pdf")) return "PDF"
  if (value.includes("wearable") || value.includes("sensor")) return "Wearables"
  if (value.endsWith(".zip")) return "Archive"
  return "Other"
}

function buildInventory(files: File[]) {
  const modalityCounts = new Map<string, number>()
  const extensionCounts = new Map<string, number>()
  const roots = new Set<string>()

  files.forEach((file) => {
    const path = getRelativePath(file)
    const lower = path.toLowerCase()
    const extension = lower.endsWith(".nii.gz") ? ".nii.gz" : lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "unknown"
    const modality = detectModality(path)
    modalityCounts.set(modality, (modalityCounts.get(modality) ?? 0) + 1)
    extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1)
    if (path.includes("/")) roots.add(path.split("/")[0])
  })

  return {
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    modalities: Array.from(modalityCounts.entries()).map(([name, count]) => ({ name, count })),
    extensions: Array.from(extensionCounts.entries()).map(([name, count]) => ({ name, count })),
    roots: Array.from(roots),
    sample: files.slice(0, 6).map(getRelativePath),
  }
}

export function DatasetUploadDialog({ open, onOpenChange }: Props) {
  const [uploadKind, setUploadKind] = React.useState<DatasetUploadKind>("files")
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [workspaces, setWorkspaces] = React.useState<Array<{ id: string; name: string }>>([])
  const [workspaceError, setWorkspaceError] = React.useState<string | null>(null)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const folderInputRef = React.useRef<HTMLInputElement | null>(null)
  const zipInputRef = React.useRef<HTMLInputElement | null>(null)
  const uploadMutation = useUploadDataset()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as never),
    defaultValues: {
      name: "",
      description: "",
      visibility: "PRIVATE",
      workspaceId: "",
      sourceProvider: "",
      sourceLocator: "",
    },
  })

  const inventory = React.useMemo(() => buildInventory(selectedFiles), [selectedFiles])
  const isExternalImport = uploadKind === "cloud" || uploadKind === "repository"

  React.useEffect(() => {
    const input = folderInputRef.current
    if (!input) return
    input.setAttribute("webkitdirectory", "")
    input.setAttribute("directory", "")
  }, [open])

  React.useEffect(() => {
    if (!open) return

    let mounted = true
    void (async () => {
      try {
        setWorkspaceError(null)
        const items = await listUploadWorkspaces()
        if (!mounted) return
        setWorkspaces(items)
        const current = form.getValues("workspaceId")
        const saved = getSavedDatasetWorkspaceId()
        const nextWorkspaceId =
          (current && items.some((workspace) => workspace.id === current) ? current : null) ??
          (saved && items.some((workspace) => workspace.id === saved) ? saved : null) ??
          items.find((workspace) => workspace.name.toLowerCase().includes("sdoh"))?.id ??
          items[0]?.id
        if (nextWorkspaceId) {
          form.setValue("workspaceId", nextWorkspaceId, { shouldValidate: true })
        }
      } catch (error) {
        if (!mounted) return
        setWorkspaceError((error as Error).message || "Unable to load workspaces")
      }
    })()

    return () => {
      mounted = false
    }
  }, [form, open])

  function resetFiles(nextKind: DatasetUploadKind) {
    setUploadKind(nextKind)
    setSelectedFiles([])
    setLocalError(null)
  }

  function acceptFiles(files: File[]) {
    setSelectedFiles(files)
    setLocalError(null)
    if (!form.getValues("name") && files.length) {
      const firstPath = getRelativePath(files[0])
      const root = firstPath.includes("/") ? firstPath.split("/")[0] : files[0].name.replace(/\.[^.]+$/, "")
      form.setValue("name", root, { shouldValidate: true })
    }
  }

  async function onSubmit(values: FormValues) {
    setLocalError(null)

    if (!isExternalImport && selectedFiles.length === 0) {
      setLocalError("Please choose dataset files, a folder, or a ZIP archive.")
      return
    }

    if (isExternalImport && !values.sourceLocator?.trim()) {
      setLocalError("Provide the cloud folder path, repository dataset ID, or import URL.")
      return
    }

    const relativePaths = selectedFiles.map(getRelativePath)
    const description =
      values.description ||
      (isExternalImport
        ? `${uploadKind === "cloud" ? "Cloud import" : "Repository import"} from ${values.sourceProvider || "external source"}: ${values.sourceLocator}`
        : `${uploadKind} upload with ${selectedFiles.length} file(s), ${inventory.modalities.length} detected research modality group(s), and ${formatBytes(inventory.totalSize)} total size.`)

    await uploadMutation.mutateAsync({
      file: selectedFiles[0],
      files: uploadKind === "folder" || uploadKind === "zip" || selectedFiles.length > 1 ? selectedFiles : undefined,
      relativePaths,
      uploadKind,
      name: values.name,
      description,
      visibility: values.visibility,
      workspaceId: values.workspaceId,
      sourceProvider: values.sourceProvider,
      sourceLocator: values.sourceLocator,
    })
    saveDatasetWorkspaceId(values.workspaceId)

    form.reset({
      name: "",
      description: "",
      visibility: "PRIVATE",
      workspaceId: values.workspaceId,
      sourceProvider: "",
      sourceLocator: "",
    })
    setSelectedFiles([])
    setUploadKind("files")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upload dataset</DialogTitle>
          <DialogDescription>
            Create a research-ready dataset from files, folders, ZIP archives, cloud storage, or external repositories.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-2 md:grid-cols-5">
              {uploadMethods.map((method) => {
                const Icon = method.icon
                const active = uploadKind === method.kind
                return (
                  <button
                    key={method.kind}
                    type="button"
                    onClick={() => resetFiles(method.kind)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active ? "border-primary bg-primary/5 shadow-sm" : "bg-background hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`mb-2 h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-semibold">{method.title}</p>
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{method.description}</p>
                  </button>
                )
              })}
            </div>

            {!isExternalImport ? (
              <div
                className="rounded-2xl border border-dashed bg-muted/30 p-6"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  acceptFiles(Array.from(event.dataTransfer.files ?? []))
                }}
              >
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <div className="rounded-full border bg-background p-3">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {uploadKind === "folder"
                        ? "Choose dataset folder"
                        : uploadKind === "zip"
                          ? "Choose dataset ZIP"
                          : "Choose dataset files"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {uploadKind === "folder"
                        ? "Folder structure and relative paths are preserved for inventory and validation."
                        : uploadKind === "zip"
                          ? "ZIP archives are queued for extraction, scanning, and profile generation."
                          : "Select one or more research files for profiling and analytics."}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept=".csv,.xlsx,.xls,.json,.jsonl,.geojson,.xml,.tsv,.txt,.parquet,.zip,.nii,.nii.gz,.gz,.vcf,.pdf"
                      onChange={(event) => acceptFiles(Array.from(event.target.files ?? []))}
                    />
                    <Input
                      ref={folderInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(event) => acceptFiles(Array.from(event.target.files ?? []))}
                    />
                    <Input
                      ref={zipInputRef}
                      type="file"
                      className="hidden"
                      accept=".zip,application/zip,application/x-zip-compressed"
                      onChange={(event) => acceptFiles(Array.from(event.target.files ?? []))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(event) => {
                        event.preventDefault()
                        if (uploadKind === "folder") folderInputRef.current?.click()
                        else if (uploadKind === "zip") zipInputRef.current?.click()
                        else fileInputRef.current?.click()
                      }}
                    >
                      Browse {uploadKind === "folder" ? "folder" : uploadKind === "zip" ? "ZIP" : "files"}
                    </Button>
                  </div>
                </div>

                {selectedFiles.length ? (
                  <div className="mt-5 grid gap-3 rounded-xl border bg-background p-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Files</p>
                      <p className="text-lg font-semibold">{selectedFiles.length}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Total size</p>
                      <p className="text-lg font-semibold">{formatBytes(inventory.totalSize)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Validation</p>
                      <p className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Inventory ready
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="mb-2 text-xs uppercase text-muted-foreground">Detected structure</p>
                      <div className="flex flex-wrap gap-2">
                        {inventory.modalities.map((item) => (
                          <span key={item.name} className="rounded-full border bg-muted px-2 py-1 text-xs">
                            {item.name}: {item.count}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 max-h-24 overflow-auto rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                        {inventory.sample.map((path) => (
                          <div key={path}>{path}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sourceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{uploadKind === "cloud" ? "Cloud provider" : "Repository"}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {uploadKind === "cloud" ? (
                            <>
                              <SelectItem value="Google Drive">Google Drive</SelectItem>
                              <SelectItem value="OneDrive">OneDrive</SelectItem>
                              <SelectItem value="Dropbox">Dropbox</SelectItem>
                              <SelectItem value="AWS S3">AWS S3</SelectItem>
                              <SelectItem value="Azure Blob">Azure Blob</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="OpenNeuro">OpenNeuro</SelectItem>
                              <SelectItem value="ADNI">ADNI</SelectItem>
                              <SelectItem value="PPMI">PPMI</SelectItem>
                              <SelectItem value="UK Biobank">UK Biobank</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sourceLocator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{uploadKind === "cloud" ? "Folder path or URL" : "Dataset ID or URL"}</FormLabel>
                      <FormControl>
                        <Input placeholder={uploadKind === "cloud" ? "s3://bucket/ADNI_Data" : "ds000001 or ADNI cohort ID"} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="rounded-xl border bg-background p-3 text-sm text-muted-foreground md:col-span-2">
                  This creates a registered import dataset now. Connector sync can later pull metadata, files, and validation results in the background.
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="workspaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose workspace for this upload" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The dataset appears in this workspace for cohort, pipeline, analytics, visualization, and publication workflows.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {workspaceError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {workspaceError}
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dataset name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ADNI Multimodal Cohort 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short summary of source, structure, modalities, and research purpose"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="TEAM">Team</SelectItem>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="RESTRICTED">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {localError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {localError}
              </div>
            ) : null}

            {uploadMutation.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {(uploadMutation.error as Error).message}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : isExternalImport ? (
                  "Register import"
                ) : (
                  "Upload dataset"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
