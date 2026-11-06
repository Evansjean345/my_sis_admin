"use client";

import Link from "next/link";

import { Contact } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVehicleDrivers } from "@/hooks/api/use-drivers";
import { driverStatusMeta } from "@/types/driver";

/** Conducteurs rattachés au véhicule — ceux de son organisation et ceux du vivier. */
export function VehicleDriversCard({ vehicleId }: { vehicleId: string }) {
  const drivers = useVehicleDrivers(vehicleId);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Conducteurs</CardTitle>
        <CardDescription>Plusieurs conducteurs peuvent partager ce véhicule.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/driver" prefetch={false}>
              Gérer
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {drivers.isPending ? (
          <LoadingRows rows={2} className="flex flex-col gap-2" />
        ) : drivers.isError ? (
          <ErrorState error={drivers.error} onRetry={() => drivers.refetch()} />
        ) : drivers.data.length === 0 ? (
          <EmptyState
            icon={<Contact />}
            title="Aucun conducteur"
            description="Rattachez un conducteur depuis sa fiche."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {drivers.data.map((d) => {
              const meta = driverStatusMeta[d.status] ?? { label: d.status, tone: "neutral" as const };
              return (
                <li key={d.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <Link
                    href={`/dashboard/driver/${d.id}`}
                    prefetch={false}
                    className="flex min-w-0 flex-col hover:underline"
                  >
                    <span className="truncate font-medium text-sm">{d.fullName}</span>
                    <span className="truncate text-muted-foreground text-xs">
                      {[d.employeeCode, d.phone].filter(Boolean).join(" · ") || (d.organizationId ? "—" : "Vivier")}
                    </span>
                  </Link>
                  <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
