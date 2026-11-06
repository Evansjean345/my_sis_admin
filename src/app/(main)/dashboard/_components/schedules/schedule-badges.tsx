import { StatusBadge, type StatusTone } from "@/components/status-badge";
import {
  type DesiredUsage,
  type EnforcementOutcome,
  enforcementOutcomeLabels,
  type ScheduleMode,
  scheduleModeLabels,
} from "@/types/schedule";

/** Badges de l'immobilisation planifiée — partagés par les horaires, les véhicules et les flottes. */

export function ModeBadge({ mode }: { mode: ScheduleMode }) {
  return (
    <StatusBadge tone={mode === "allowed" ? "success" : "danger"} dot={false}>
      {scheduleModeLabels[mode]}
    </StatusBadge>
  );
}

export function UsageBadge({ state }: { state: DesiredUsage }) {
  return (
    <StatusBadge tone={state === "free" ? "success" : "danger"}>
      {state === "free" ? "Libre" : "Immobilisé"}
    </StatusBadge>
  );
}

const outcomeTone: Record<EnforcementOutcome, StatusTone> = {
  idle: "neutral",
  dispatch: "orange",
  waiting_in_flight: "info",
  waiting_retry: "warning",
  completed: "success",
  overridden: "warning",
  manual_cut_kept: "warning",
  already_immobilized: "neutral",
};

export function OutcomeBadge({ outcome, action }: { outcome: EnforcementOutcome; action?: "cut" | "restore" | null }) {
  const label =
    outcome === "dispatch" && action
      ? action === "cut"
        ? "Couperait le moteur"
        : "Rétablirait le moteur"
      : enforcementOutcomeLabels[outcome];
  return (
    <StatusBadge tone={outcomeTone[outcome]} dot={false}>
      {label}
    </StatusBadge>
  );
}
