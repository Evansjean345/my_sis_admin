"use client";

import { cn } from "cn";

import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip";
import { formatRelative } from "@shared/lib/format";
import { useRealtimeStore } from "@shared/stores/realtime/realtime-store";

const META = {
  idle: { label: "Temps réel inactif", dot: "bg-zinc-400", text: "text-muted-foreground" },
  connecting: { label: "Connexion au flux…", dot: "bg-amber-500 animate-pulse", text: "text-amber-600" },
  connected: { label: "En direct", dot: "bg-emerald-500 animate-ping", text: "text-emerald-600" },
  reconnecting: { label: "Reconnexion…", dot: "bg-amber-500 animate-pulse", text: "text-amber-600" },
  disconnected: { label: "Flux coupé", dot: "bg-red-500", text: "text-red-600" },
} as const;

/** Pastille « live » de l'en-tête : état du flux SSE et dernier évènement reçu. */
export function RealtimeStatus() {
  const status = useRealtimeStore((s) => s.status);
  const channels = useRealtimeStore((s) => s.channels);
  const lastEventAt = useRealtimeStore((s) => s.lastEventAt);
  const received = useRealtimeStore((s) => s.received);
  // Flux ouvert mais aucun canal accordé : rien n'arrivera.
  const effective = status === "connected" && channels === 0 ? "connecting" : status;
  const meta = META[effective];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full border px-2 py-0.5 font-semibold text-[11px] sm:flex",
            meta.text,
          )}
        >
          <span className="relative flex size-2">
            <span className={cn("absolute inline-flex size-full rounded-full", meta.dot)} />
            <span className={cn("relative inline-flex size-2 rounded-full", meta.dot.split(" ")[0])} />
          </span>
          {effective === "connected" ? "LIVE" : meta.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-0.5 text-xs">
          <span>{meta.label}</span>
          <span>
            {channels} canal{channels > 1 ? "aux" : ""} suivi{channels > 1 ? "s" : ""} · {received} évènement
            {received > 1 ? "s" : ""}
          </span>
          {lastEventAt ? <span>Dernier : {formatRelative(new Date(lastEventAt).toISOString())}</span> : null}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
