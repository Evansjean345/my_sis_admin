import type { ReactNode } from "react";

/** En-tête de page aligné sur les écrans existants (titre 3xl, description muted, actions à droite). */
export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between text-muted">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-extrabold text-2xl leading-tight tracking-tight sm:text-3xl sm:leading-none">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
