"use client";

import type { ReactNode } from "react";

import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@shared/components/ui/empty";
import { Skeleton } from "@shared/components/ui/skeleton";
import { getErrorMessage } from "@shared/lib/axios";

export function LoadingRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={className ?? "flex flex-col gap-2 p-4"} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: squelettes statiques
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "Impossible de charger les données",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangle className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
      </EmptyHeader>
      {onRetry ? (
        <EmptyContent>
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw data-icon="inline-start" />
            Réessayer
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon ?? <Inbox />}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
