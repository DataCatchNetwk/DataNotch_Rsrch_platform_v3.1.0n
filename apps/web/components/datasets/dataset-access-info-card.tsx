'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { pullDatasetToWorkspace, requestDatasetAccess } from '@/lib/api/dataset-details';
import type { DatasetDetails } from '@/types/dataset-details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Download, Lock, Globe, RefreshCw, Tag, ExternalLink } from 'lucide-react';

interface Props {
  dataset: DatasetDetails;
  workspaces?: Array<{ id: string; name: string }>;
}

export function DatasetAccessInfoCard({ dataset, workspaces = [] }: Props) {
  const [pullDialogOpen, setPullDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [justification, setJustification] = useState('');

  const { mutate: doPull, isPending: isPulling } = useMutation({
    mutationFn: () => pullDatasetToWorkspace(dataset.id, selectedWorkspace, 'COPY'),
    onSuccess: () => {
      toast.success('Dataset pull started', { description: 'You can track progress in the workspace.' });
      setPullDialogOpen(false);
    },
    onError: () => toast.error('Failed to initiate pull'),
  });

  const { mutate: doRequest, isPending: isRequesting } = useMutation({
    mutationFn: () => requestDatasetAccess(dataset.id, justification),
    onSuccess: () => {
      toast.success('Access request submitted');
      setAccessDialogOpen(false);
      setJustification('');
    },
    onError: () => toast.error('Failed to submit access request'),
  });

  return (
    <>
      <div className="space-y-4">
        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {dataset.license && (
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">License</p>
                <p className="font-medium">{dataset.license}</p>
              </div>
            </div>
          )}
          {dataset.domain && (
            <div className="flex items-start gap-2">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Domain</p>
                <p className="font-medium">{dataset.domain}</p>
              </div>
            </div>
          )}
          {dataset.sourceName && (
            <div className="flex items-start gap-2">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Source</p>
                {dataset.sourceUrl ? (
                  <a
                    href={dataset.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {dataset.sourceName}
                  </a>
                ) : (
                  <p className="font-medium">{dataset.sourceName}</p>
                )}
              </div>
            </div>
          )}
          {dataset.refreshCadence && (
            <div className="flex items-start gap-2">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Refresh cadence</p>
                <p className="font-medium capitalize">{dataset.refreshCadence.toLowerCase()}</p>
              </div>
            </div>
          )}
          {dataset.provenance && (
            <div className="col-span-2 flex items-start gap-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Provenance</p>
                <p className="font-medium">{dataset.provenance}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {dataset.tags && dataset.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {dataset.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => setPullDialogOpen(true)}
            disabled={workspaces.length === 0}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Pull to Workspace
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAccessDialogOpen(true)}>
            <Lock className="mr-1.5 h-4 w-4" />
            Request Access
          </Button>
        </div>
      </div>

      {/* Pull dialog */}
      <Dialog open={pullDialogOpen} onOpenChange={setPullDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pull dataset to workspace</DialogTitle>
            <DialogDescription>
              Select a workspace to pull <strong>{dataset.name}</strong> into.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
              <SelectTrigger>
                <SelectValue placeholder="Select workspace…" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPullDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => doPull()} disabled={!selectedWorkspace || isPulling}>
              {isPulling ? 'Pulling…' : 'Pull'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access request dialog */}
      <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request access</DialogTitle>
            <DialogDescription>
              Describe why you need access to <strong>{dataset.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Justification…"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAccessDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => doRequest()} disabled={!justification.trim() || isRequesting}>
              {isRequesting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
