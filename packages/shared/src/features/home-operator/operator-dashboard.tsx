"use client";

import { useMemo } from "react";

import { useRouter } from "next/navigation";

import { Info, RefreshCw } from "lucide-react";

import { PageHeader } from "@shared/components/page-header";
import { useAccess } from "@shared/components/providers/access-provider";
import { ErrorState } from "@shared/components/query-state";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { ScrollArea } from "@shared/components/ui/scroll-area";
import { LiveFleetCard } from "@shared/features/common/live/live-fleet-card";
import { FleetAlerts } from "@shared/features/fleet/fleet-alerts";
import { FleetKpis } from "@shared/features/fleet/fleet-kpis";
import { deriveAlerts } from "@shared/features/fleet/fleet-state";
import { OperatorVehicles } from "@shared/features/home-operator/operator-vehicles";
import { ActivityChart } from "@shared/features/home-platform/activity-chart";
import { useAdminActivity } from "@shared/hooks/api/use-admin";
import { useFleet } from "@shared/hooks/api/use-fleet";
import { useLiveVehicles } from "@shared/hooks/use-live-vehicles";

/**
 * Tableau de bord NIVEAU 3 — opérateur, client final.
 *
 * Même socle que le tableau de bord principal (carte, KPI de flotte, courbes
 * d'activité), recentré sur le SUIVI : la flotte de l'organisation en temps
 * réel, ses alertes, et la sécurité des véhicules. Aucune création
 * d'utilisateur, de tracker, de flotte ni de véhicule — ni ici, ni dans le
 * menu (cf. `operatorSidebarItems`), et l'API les refuse de toute façon.
 */
export function OperatorDashboard() {
  const router = useRouter();
  const { organizationName, user } = useAccess();

  const fleet = useFleet();
  const vehicles = useLiveVehicles(fleet.vehicles);
  const activity = useAdminActivity({ days: 7 });
  const alerts = useMemo(() => deriveAlerts(vehicles), [vehicles]);

  const firstName = user?.fullName.split(" ")[0];

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={firstName ? `Bonjour ${firstName}` : "Mon espace"}
        description={
          organizationName ? (
            <>
              Suivi en temps réel des véhicules de{" "}
              <span className="font-medium text-foreground">{organizationName}</span>
            </>
          ) : (
            "Suivi en temps réel de vos véhicules"
          )
        }
        actions={
          <Button variant="outline" size="sm" onClick={fleet.refetch} disabled={fleet.isFetching}>
            <RefreshCw data-icon="inline-start" className={fleet.isFetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
        }
      />

      {fleet.isError ? (
        <ErrorState error={fleet.error} onRetry={fleet.refetch} />
      ) : (
        <>
          <FleetKpis vehicles={vehicles} total={fleet.total} loading={fleet.isPending} />

          <div className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <LiveFleetCard vehicles={vehicles} loading={fleet.isPending} title="Mes véhicules en direct" />

            <Card className="min-h-0 gap-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Alertes en direct
                  <Badge variant={alerts.length > 0 ? "destructive" : "secondary"} className="rounded-full">
                    {alerts.length}
                  </Badge>
                </CardTitle>
                <CardDescription>Survitesse, perte de signal, moteur tournant à l'arrêt</CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 px-0">
                <ScrollArea className="h-[440px]">
                  <div className="px-4 pb-2">
                    <FleetAlerts alerts={alerts} onSelect={(id) => router.push(`/dashboard/fleet?vehicle=${id}`)} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <OperatorVehicles vehicles={vehicles} loading={fleet.isPending} />

          <div className="rounded-xl bg-[#0E508D] shadow-xl">
            <ActivityChart days={activity.data?.days} loading={activity.isPending} />
          </div>

          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              Besoin d'un nouveau véhicule, d'un tracker, d'une flotte ou d'un compte ? Ces opérations sont réservées à
              l'administrateur de votre organisation.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
