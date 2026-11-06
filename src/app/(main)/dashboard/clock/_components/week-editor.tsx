"use client";

import { Copy, Eraser, Plus, Trash2, Wand2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DAY_LABELS, WEEK_ORDER } from "@/types/schedule";

import { WeekPreview } from "../../_components/schedules/week-preview";
import {
  type DraftWindow,
  toTimeInput,
  validateWindows,
  WEEK_PRESETS,
  weeklyHours,
} from "../../_components/schedules/week-utils";

/**
 * Éditeur de semaine type — contrôlé.
 *
 * Une ligne par jour (lundi en tête), autant de plages que nécessaire.
 * L'aperçu en barres et l'erreur de validation se mettent à jour en direct :
 * l'exploitant voit ce que le moteur appliquera avant d'enregistrer.
 */
export function WeekEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: DraftWindow[];
  onChange: (windows: DraftWindow[]) => void;
  disabled?: boolean;
}) {
  const erreur = validateWindows(value);

  function update(index: number, patch: Partial<DraftWindow>) {
    onChange(value.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  }

  function add(day: number) {
    const last = value.filter((w) => w.dayOfWeek === day).at(-1);
    const startTime = last ? toTimeInput(last.endTime) : "08:00";
    onChange([...value, { dayOfWeek: day, startTime, endTime: last ? "00:00" : "18:00" }]);
  }

  function copyMondayToWeekdays() {
    const lundi = value.filter((w) => w.dayOfWeek === 1);
    const autres = value.filter((w) => ![2, 3, 4, 5].includes(w.dayOfWeek));
    onChange([...autres, ...[2, 3, 4, 5].flatMap((d) => lundi.map((w) => ({ ...w, dayOfWeek: d })))]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline" disabled={disabled}>
              <Wand2 data-icon="inline-start" />
              Modèle
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Remplacer la semaine par…</DropdownMenuLabel>
            <DropdownMenuGroup>
              {WEEK_PRESETS.map((preset) => (
                <DropdownMenuItem key={preset.id} onClick={() => onChange(preset.windows)}>
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !value.some((w) => w.dayOfWeek === 1)}
          onClick={copyMondayToWeekdays}
        >
          <Copy data-icon="inline-start" />
          Copier le lundi sur mar. – ven.
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || value.length === 0}
          onClick={() => onChange([])}
        >
          <Eraser data-icon="inline-start" />
          Tout effacer
        </Button>
        <span className="ml-auto text-muted-foreground text-xs tabular-nums">
          {value.length} plage(s) · {weeklyHours(value)} h / semaine
        </span>
      </div>

      <ul className="divide-y rounded-lg border">
        {WEEK_ORDER.map((day) => {
          const plages = value.map((w, index) => ({ w, index })).filter(({ w }) => w.dayOfWeek === day);
          return (
            <li key={day} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-start">
              <span className="w-24 shrink-0 pt-1.5 font-medium text-sm">{DAY_LABELS[day]}</span>
              <div className="flex flex-1 flex-col gap-2">
                {plages.length === 0 ? (
                  <span className="pt-1.5 text-muted-foreground text-sm">Aucune plage</span>
                ) : (
                  plages.map(({ w, index }) => (
                    <div key={index} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        step={300}
                        className="h-8 w-28"
                        aria-label={`${DAY_LABELS[day]} : début de plage`}
                        value={toTimeInput(w.startTime)}
                        disabled={disabled}
                        onChange={(e) => update(index, { startTime: e.target.value })}
                      />
                      <span className="text-muted-foreground text-sm">→</span>
                      <Input
                        type="time"
                        step={300}
                        className="h-8 w-28"
                        aria-label={`${DAY_LABELS[day]} : fin de plage (00:00 = minuit)`}
                        value={toTimeInput(w.endTime)}
                        disabled={disabled}
                        onChange={(e) => update(index, { endTime: e.target.value })}
                      />
                      {toTimeInput(w.endTime) === "00:00" ? (
                        <span className="text-muted-foreground text-xs">minuit</span>
                      ) : null}
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={disabled}
                        aria-label={`Supprimer la plage du ${DAY_LABELS[day].toLowerCase()}`}
                        onClick={() => onChange(value.filter((_, i) => i !== index))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="self-start"
                disabled={disabled}
                onClick={() => add(day)}
              >
                <Plus data-icon="inline-start" />
                Plage
              </Button>
            </li>
          );
        })}
      </ul>

      {erreur ? (
        <Alert variant="destructive">
          <AlertDescription>{erreur}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-lg border p-3">
        <p className="mb-2 text-muted-foreground text-xs">
          Aperçu des plages. C'est le rattachement qui décide : en mode « Autorisé », le véhicule ne roule que pendant
          les plages ; en mode « Interdit », il est immobilisé pendant les plages. Une fin à 00:00 signifie minuit.
        </p>
        <WeekPreview windows={value} />
      </div>
    </div>
  );
}
