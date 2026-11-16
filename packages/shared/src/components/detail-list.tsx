import type { ReactNode } from "react";

import { cn } from "cn";

export interface DetailItem {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

/** Liste de définitions au style de l'écran profil (dt muted xs / dd sm). */
export function DetailList({ items, className }: { items: DetailItem[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col gap-1">
          <dt className="text-muted-foreground text-xs">{item.label}</dt>
          <dd className={cn("truncate text-sm", item.mono && "font-mono text-xs")}>{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
