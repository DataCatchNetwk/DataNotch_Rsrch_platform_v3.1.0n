"use client"

import { useState } from "react"
import { createSupportTicket } from "@/lib/api/support"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, LifeBuoy, Paperclip } from "lucide-react"

export function SupportRequestForm() {
  const [category, setCategory] = useState("LOGIN")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      formData.set("category", category)
      const ticket = await createSupportTicket(formData)
      setSuccess(`Ticket ${ticket.ticketNumber} was created successfully.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border">
          <LifeBuoy className="h-5 w-5" />
        </div>
        <CardTitle>Contact Support</CardTitle>
        <CardDescription>
          Submit an issue from the login page or public access flow.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input name="requesterName" placeholder="Full name" />
            <Input name="requesterEmail" type="email" placeholder="Email address" required />
          </div>

          <Input name="subject" placeholder="Subject" required />

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="BILLING">Billing</SelectItem>
              <SelectItem value="TECHNICAL">Technical</SelectItem>
              <SelectItem value="DATASET">Dataset</SelectItem>
              <SelectItem value="ACCESS">Access</SelectItem>
              <SelectItem value="ACCOUNT">Account</SelectItem>
              <SelectItem value="SECURITY">Security</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            name="description"
            placeholder="Describe your issue in detail"
            className="min-h-[160px]"
            required
          />

          <div className="rounded-xl border border-dashed p-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <Paperclip className="h-4 w-4" />
              <span>Attach screenshot or supporting file</span>
              <Input name="attachment" type="file" className="hidden" />
            </label>
          </div>

          {success ? <div className="rounded-xl border p-3 text-sm">{success}</div> : null}

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={loading} className="w-full rounded-xl">
            {loading ? "Submitting..." : "Submit Support Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
