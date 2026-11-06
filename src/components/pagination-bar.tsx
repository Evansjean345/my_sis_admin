"use client";

import type { MouseEvent } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaginationMeta } from "@/types/api";

interface PaginationBarProps {
  /**
   * Seuls les compteurs sont lus : le journal d'audit renvoie la même `meta`
   * que Lucid mais SANS les URLs de page, et doit pouvoir réutiliser la barre.
   */
  meta: Pick<PaginationMeta, "total" | "perPage" | "currentPage" | "lastPage"> | undefined;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  label?: string;
}

function stop(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

/** Pagination pilotée par la `meta` de l'API (Lucid paginate). */
export function PaginationBar({
  meta,
  perPage,
  onPageChange,
  onPerPageChange,
  label = "éléments",
}: PaginationBarProps) {
  const page = meta?.currentPage ?? 1;
  const last = Math.max(meta?.lastPage ?? 1, 1);
  const total = meta?.total ?? 0;
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className="flex flex-col gap-3 border-t px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-sm tabular-nums">
        {start} à {end} sur {total} {label}
      </div>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              size="sm"
              href="#"
              text=""
              className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              onClick={(e) => {
                stop(e);
                onPageChange(page - 1);
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink size="sm" href="#" isActive onClick={stop}>
              {page}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <span className="px-1 text-muted-foreground text-sm">/ {last}</span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              size="sm"
              href="#"
              text=""
              className={page >= last ? "pointer-events-none opacity-50" : undefined}
              onClick={(e) => {
                stop(e);
                onPageChange(page + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Lignes par page</span>
        <Select value={`${perPage}`} onValueChange={(v) => onPerPageChange(Number(v))}>
          <SelectTrigger size="sm" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top" align="end">
            <SelectGroup>
              {[12, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={`${n}`}>
                  {n}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
