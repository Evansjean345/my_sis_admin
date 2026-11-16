"use client";

import { useEffect, useMemo, useState } from "react";

import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@shared/components/providers/access-provider";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Spinner } from "@shared/components/ui/spinner";
import { WeekEditor } from "@shared/features/clock/week-editor";
import { type DraftWindow, normalizeWindows, validateWindows } from "@shared/features/common/schedules/week-utils";
import { useReplaceScheduleWindows } from "@shared/hooks/api/use-schedules";
import { getErrorMessage } from "@shared/lib/axios";
import type { ScheduleWindow } from "@shared/types/schedule";

const signature = (windows: DraftWindow[]) => JSON.stringify(normalizeWindows(windows));

/** Plages d'un calendrier : édition locale, enregistrement de la semaine entière en une fois. */
export function ScheduleWindowsCard({ scheduleId, windows }: { scheduleId: string; windows: ScheduleWindow[] }) {
  const initial = useMemo(
    () => windows.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
    [windows],
  );
  const [draft, setDraft] = useState<DraftWindow[]>(initial);
  const replace = useReplaceScheduleWindows();

  useEffect(() => setDraft(initial), [initial]);

  const modifie = signature(draft) !== signature(initial);
  const erreur = validateWindows(draft);

  function save() {
    replace.mutate(
      { id: scheduleId, windows: normalizeWindows(draft) },
      {
        onSuccess: () =>
          toast.success("Plages enregistrées", { description: "Appliquées au prochain passage du moteur (≤ 1 min)." }),
        onError: (error) => toast.error("Enregistrement impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Semaine type</CardTitle>
        <CardDescription>
          Les plages sont lues dans le fuseau du calendrier. Une plage qui passe minuit se saisit en deux.
        </CardDescription>
        <CardAction className="flex gap-2">
          <Can permission="policy:write">
            <Button
              size="sm"
              variant="outline"
              disabled={!modifie || replace.isPending}
              onClick={() => setDraft(initial)}
            >
              <RotateCcw data-icon="inline-start" />
              Annuler
            </Button>
            <Button size="sm" disabled={!modifie || Boolean(erreur) || replace.isPending} onClick={save}>
              {replace.isPending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
              Enregistrer
            </Button>
          </Can>
        </CardAction>
      </CardHeader>
      <CardContent>
        <WeekEditor value={draft} onChange={setDraft} disabled={replace.isPending} />
      </CardContent>
    </Card>
  );
}
