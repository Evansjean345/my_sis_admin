"use client";

import { useEffect } from "react";

import { Pause, Play, RotateCcw, X } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import { Slider } from "@shared/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@shared/components/ui/toggle-group";
import { formatDateTime, formatNumber } from "@shared/lib/format";
import type { TrackPoint } from "@shared/types/track";

export interface ReplayState {
  index: number | null;
  playing: boolean;
  speed: number;
}

export const REPLAY_IDLE: ReplayState = { index: null, playing: false, speed: 4 };

interface TripReplayProps {
  points: TrackPoint[];
  state: ReplayState;
  onChange: (next: ReplayState) => void;
}

/** Rejeu du trajet : un point par tick (250 ms), accéléré ×1 à ×16. */
export function TripReplay({ points, state, onChange }: TripReplayProps) {
  const last = points.length - 1;

  useEffect(() => {
    if (!state.playing || state.index === null) return;
    const id = setInterval(() => {
      const next = Math.min((state.index ?? 0) + state.speed, last);
      onChange({ ...state, index: next, playing: next < last });
    }, 250);
    return () => clearInterval(id);
  }, [state, last, onChange]);

  if (points.length < 2) return null;
  const current = state.index !== null ? points[state.index] : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">Rejouer le trajet</span>
        {state.index !== null ? (
          <Button size="icon-xs" variant="ghost" aria-label="Fermer le rejeu" onClick={() => onChange(REPLAY_IDLE)}>
            <X />
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="icon-sm"
          aria-label={state.playing ? "Pause" : "Lecture"}
          onClick={() => {
            const atEnd = state.index === null || state.index >= last;
            onChange({ ...state, index: atEnd ? 0 : state.index, playing: !state.playing || atEnd });
          }}
        >
          {state.playing ? <Pause /> : <Play />}
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Revenir au départ"
          onClick={() => onChange({ ...state, index: 0, playing: false })}
        >
          <RotateCcw />
        </Button>
        <Slider
          className="flex-1"
          min={0}
          max={last}
          step={1}
          value={[state.index ?? 0]}
          aria-label="Position dans le trajet"
          onValueChange={([v]) => onChange({ ...state, index: v, playing: false })}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs tabular-nums">
          {current ? `${formatDateTime(current.ts)} · ${formatNumber(current.speed, 0)} km/h` : "Appuyez sur lecture"}
        </span>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          spacing={0}
          value={String(state.speed)}
          onValueChange={(v) => v && onChange({ ...state, speed: Number(v) })}
          aria-label="Vitesse de rejeu"
        >
          {[1, 4, 16].map((s) => (
            <ToggleGroupItem key={s} value={String(s)} className="px-2 text-xs">
              ×{s}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
