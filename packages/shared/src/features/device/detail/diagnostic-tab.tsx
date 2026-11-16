"use client";

import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";

import { DetailList } from "@shared/components/detail-list";
import { ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { useDeviceDiagnostic } from "@shared/hooks/api/use-devices";
import { formatDateTime, formatNumber, formatRelative } from "@shared/lib/format";

function Check({ ok, label }: { ok: boolean | null; label: string }) {
  const Icon = ok === null ? AlertTriangle : ok ? CheckCircle2 : XCircle;
  return (
    <li className="flex items-center gap-2 text-sm">
      <Icon
        className={ok === null ? "size-4 text-amber-500" : ok ? "size-4 text-emerald-600" : "size-4 text-destructive"}
      />
      {label}
    </li>
  );
}

export function DiagnosticTab({ deviceId }: { deviceId: string }) {
  const diagnostic = useDeviceDiagnostic(deviceId);

  if (diagnostic.isPending) return <LoadingRows rows={6} />;
  if (diagnostic.isError) return <ErrorState error={diagnostic.error} onRetry={() => diagnostic.refetch()} />;

  const d = diagnostic.data;
  const protocolMatch = d.device && d.channel ? d.device.protocolId === d.channel.protocolId : null;
  const recent = d.lastMessageAt ? Date.now() - new Date(d.lastMessageAt).getTime() < 3600_000 : false;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {d.linked ? (
            <StatusBadge tone="success">Device présent chez flespi</StatusBadge>
          ) : (
            <StatusBadge tone="danger">Device absent chez flespi</StatusBadge>
          )}
          {d.device ? (
            <StatusBadge tone={d.device.enabled ? "success" : "neutral"}>
              {d.device.enabled ? "Activé" : "Désactivé"}
            </StatusBadge>
          ) : null}
        </div>
        <Button size="sm" variant="outline" onClick={() => diagnostic.refetch()} disabled={diagnostic.isFetching}>
          <RefreshCw data-icon="inline-start" className={diagnostic.isFetching ? "animate-spin" : undefined} />
          Relancer le diagnostic
        </Button>
      </div>

      {d.problems.length > 0 ? (
        <div className="flex flex-col gap-2">
          {d.problems.map((problem) => (
            <Alert key={problem} variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Problème détecté</AlertTitle>
              <AlertDescription>{problem}</AlertDescription>
            </Alert>
          ))}
        </div>
      ) : (
        <Alert>
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertTitle>Aucun problème détecté</AlertTitle>
          <AlertDescription>Le rattachement flespi est cohérent et le boîtier émet.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Protocole du tracker</CardTitle>
              <CardDescription>Device flespi et canal de réception.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Nom flespi", value: d.device?.name ?? "—" },
                  { label: "ID device flespi", value: d.device?.id ?? "—", mono: true },
                  { label: "Ident", value: d.device?.ident ?? "—", mono: true },
                  { label: "Type de boîtier", value: d.device?.deviceType ?? "—" },
                  { label: "ID type", value: d.device?.deviceTypeId ?? "—", mono: true },
                  { label: "Protocole (device)", value: d.device?.protocolId ?? "—", mono: true },
                  { label: "Canal", value: d.channel?.id ?? "—", mono: true },
                  { label: "URI du canal", value: d.channel?.uri ?? "—", mono: true },
                  { label: "Protocole (canal)", value: d.channel?.protocolId ?? "—", mono: true },
                  { label: "Téléphone (SIM)", value: d.device?.phone ?? "—" },
                  {
                    label: "Rétention des messages",
                    value: d.device ? `${formatNumber(d.device.messagesTtl / 86400)} jours` : "—",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Dernier état connu</CardTitle>
              <CardDescription>
                {d.lastMessageAt
                  ? `${formatDateTime(d.lastMessageAt)} · ${formatRelative(d.lastMessageAt)}`
                  : "Aucune trame reçue"}
              </CardDescription>
              <CardAction>
                <StatusBadge tone={recent ? "success" : d.lastMessageAt ? "warning" : "danger"}>
                  {recent ? "Actif" : d.lastMessageAt ? "En veille" : "Muet"}
                </StatusBadge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  {
                    label: "Position",
                    value:
                      d.position?.latitude != null && d.position.longitude != null
                        ? `${d.position.latitude}, ${d.position.longitude}`
                        : "—",
                    mono: true,
                  },
                  { label: "Vitesse", value: d.position?.speed != null ? `${d.position.speed} km/h` : "—" },
                  { label: "Satellites", value: d.position?.satellites ?? "—" },
                  {
                    label: "Fix GPS",
                    value: d.position?.valid == null ? "—" : d.position.valid ? "Valide" : "Invalide",
                  },
                  { label: "Contact", value: d.ignition == null ? "—" : d.ignition ? "Allumé" : "Coupé" },
                  { label: "Batterie", value: d.batteryLevel != null ? `${d.batteryLevel} %` : "—" },
                  { label: "Signal GSM", value: d.gsmSignal ?? "—" },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>Points de contrôle</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              <Check ok={d.linked} label="Device existant chez flespi" />
              <Check ok={protocolMatch} label="Protocole du device = protocole du canal" />
              <Check ok={Boolean(d.lastMessageAt)} label="Au moins une trame reçue" />
              <Check ok={d.lastMessageAt ? recent : false} label="Trame reçue il y a moins d'une heure" />
              <Check ok={d.device ? Boolean(d.device.phone) : null} label="Numéro SIM renseigné (repli SMS)" />
              <Check ok={d.position?.valid ?? null} label="Fix GPS valide" />
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
