"use client"

import * as React from "react"
import { UploadCloud, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUploadDataset } from "@/hooks/use-upload-dataset"

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
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DatasetUploadDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const uploadMutation = useUploadDataset()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as never),
    defaultValues: {
      name: "",
      description: "",
      visibility: "PRIVATE",
    },
  })

  async function onSubmit(values: FormValues) {
    if (!file) {
      form.setError("name", {
        type: "manual",
        message: "Please choose a dataset file",
      })
      return
    }

    await uploadMutation.mutateAsync({
      file,
      name: values.name,
      description: values.description,
      visibility: values.visibility,
    })

    form.reset()
    setFile(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload dataset</DialogTitle>
          <DialogDescription>
            Add a new research dataset for analysis, cleaning, and reporting.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-2xl border border-dashed bg-muted/30 p-6">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
                <div className="rounded-full border bg-background p-3">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Choose dataset file</p>
                  <p className="text-sm text-muted-foreground">CSV, XLSX, JSON, TSV, or ZIP</p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.json,.tsv,.zip"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(event) => {
                    event.preventDefault()
                    fileInputRef.current?.click()
                  }}
                >
                  Browse file
                </Button>
                {file ? (
                  <p className="text-sm text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{file.name}</span>
                  </p>
                ) : null}
              </label>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dataset name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. T2DM Sensor Cohort 2026" {...field} />
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
                      placeholder="Short summary of dataset source, structure, and purpose"
                      rows={4}
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
                    Uploading...
                  </>
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
