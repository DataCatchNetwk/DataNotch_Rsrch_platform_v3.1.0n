'use client';

import { useState } from 'react';
import { AlertCircle, LifeBuoy } from 'lucide-react';
import { createSupportTicket } from '@/lib/api/support';
import type { SupportTicketCategory } from '@/types/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type SupportRequestFormProps = {
  defaultEmail?: string;
  defaultName?: string;
};

export function SupportRequestForm({ defaultEmail = '', defaultName = '' }: SupportRequestFormProps) {
  const [requesterName, setRequesterName] = useState(defaultName);
  const [requesterEmail, setRequesterEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [category, setCategory] = useState<SupportTicketCategory>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const ticket = await createSupportTicket({
        requesterName: requesterName || undefined,
        requesterEmail,
        subject,
        description,
        category,
        attachment,
      });

      setSuccess(`Ticket ${ticket.ticketNumber} was created successfully.`);
      setSubject('');
      setDescription('');
      setCategory('LOGIN');
      setAttachment(null);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to submit support request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border">
          <LifeBuoy className="h-5 w-5" />
        </div>
        <CardTitle>Contact Support</CardTitle>
        <CardDescription>Submit a support request and our team will get back to you.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              name="requesterName"
              value={requesterName}
              onChange={(event) => setRequesterName(event.target.value)}
              placeholder="Full name"
            />
            <Input
              name="requesterEmail"
              type="email"
              value={requesterEmail}
              onChange={(event) => setRequesterEmail(event.target.value)}
              placeholder="Email address"
              required
            />
          </div>

          <Input
            name="subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            required
          />

          <Select value={category} onValueChange={(value) => setCategory(value as SupportTicketCategory)}>
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
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe your issue in detail"
            className="min-h-[160px]"
            required
          />

          <Input
            type="file"
            accept=".png,.jpg,.jpeg,.pdf,.txt,.doc,.docx"
            onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
          />

          {success ? <div className="rounded-xl border p-3 text-sm">{success}</div> : null}

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={loading} className="w-full rounded-xl">
            {loading ? 'Submitting...' : 'Submit Support Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
