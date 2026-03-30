"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GovernanceLoading() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Card key={idx} className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((__, inner) => <Skeleton key={inner} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function GovernanceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert className="rounded-2xl border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Unable to load governance data</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message}</span>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
