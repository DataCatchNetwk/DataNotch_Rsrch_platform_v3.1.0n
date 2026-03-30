"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, PlayCircle } from "lucide-react"
import { toast } from "sonner"

import { useStartAnalysis } from "@/hooks/use-start-analysis"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  title: z.string().min(3, "Analysis title is required"),
  templateId: z.string().min(1, "Select an analysis template"),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const templates = [
  { id: "desc-summary", name: "Descriptive Summary" },
  { id: "quality-check", name: "Data Quality Check" },
  { id: "correlation-explorer", name: "Correlation Explorer" },
  { id: "predictive-baseline", name: "Predictive Baseline" },
]

export function DatasetAnalysisDrawer({
  open,
  onOpenChange,
  datasetId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasetId: string
}) {
  const mutation = useStartAnalysis()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      templateId: "",
      notes: "",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const result = await mutation.mutateAsync({
        datasetId,
        templateId: values.templateId,
        title: values.title,
        notes: values.notes,
      })
      toast.success(`Analysis started. Job: ${result.jobId}`)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Launch Analysis</SheetTitle>
          <SheetDescription>
            Start a new pipeline run for this dataset with a selected template.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analysis title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. T2DM Cohort Baseline Analysis" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an analysis template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Run notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Optional instructions, inclusion rules, thresholds, or modeling notes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting analysis...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start analysis
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
