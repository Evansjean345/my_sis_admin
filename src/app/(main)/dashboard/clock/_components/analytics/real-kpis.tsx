import { Clock3, PowerOff, ShieldAlert, Unplug } from "lucide-react";

import { MetricCard, metricGridClass } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { refusalLabels, type ScheduleHistory } from "@/types/schedule";

import { formatDuration, formatRate, formatVehicles } from "./format";

/** Taux de réussite : vert dès 95 %, orange dès 80 %, rouge en dessous. */
function rateTone(part: number, whole: number): "neutral" | "success" | "warning" | "danger" {
  if (whole === 0) return "neutral";
  const r = part / whole;
  if (r >= 0.95) return "success";
  if (r >= 0.8) return "warning";
  return "danger";
}

/** Indicateurs de l'historique réel du mois. */
export function RealKpis({ history, monthLabel }: { history: ScheduleHistory; monthLabel: string }) {
  const { cut, restore, refusals, refusedVehicles, executionDelay, commandLatency } = history.totals;
  const topReason = history.refusalsByCode[0];

  return (
    <div className={metricGridClass}>
      <MetricCard
        icon={PowerOff}
        label={`Coupures confirmées en ${monthLabel}`}
        value={formatVehicles(cut.acknowledged)}
        badge={
          <StatusBadge tone={rateTone(cut.acknowledged, cut.requested)} dot={false}>
            {formatRate(cut.acknowledged, cut.requested)} des émises
          </StatusBadge>
        }
        hint={`${cut.requested} émise(s) · ${cut.failed + cut.expired} échec(s) · ${cut.inFlight} en cours.`}
      />
      <MetricCard
        icon={Unplug}
        label="Rétablissements confirmés"
        value={formatVehicles(restore.acknowledged)}
        badge={
          <StatusBadge tone={rateTone(restore.acknowledged, restore.requested)} dot={false}>
            {formatRate(restore.acknowledged, restore.requested)} des émis
          </StatusBadge>
        }
        hint={`${restore.requested} émis · ${restore.failed + restore.expired} échec(s) · ${restore.inFlight} en cours.`}
      />
      <MetricCard
        icon={ShieldAlert}
        label="Refus avant émission"
        value={formatVehicles(refusals)}
        hint={
          refusals > 0
            ? `${refusedVehicles} véhicule(s) · surtout : ${(refusalLabels[topReason?.code ?? ""] ?? topReason?.code ?? "—").toLowerCase()}.`
            : "Aucune tentative refusée par les garde-fous."
        }
      />
      <MetricCard
        icon={Clock3}
        label="Délai réel de coupure (médian)"
        value={formatDuration(executionDelay.cut.median)}
        hint={
          executionDelay.cut.samples > 0
            ? `De l'entrée en plage à la confirmation · p90 ${formatDuration(executionDelay.cut.p90)} · boîtier seul ${formatDuration(commandLatency.cut.median)}.`
            : "Pas encore de coupure confirmée sur la période."
        }
      />
    </div>
  );
}
