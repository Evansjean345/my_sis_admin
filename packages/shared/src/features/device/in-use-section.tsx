import Image from "next/image";
import Link from "next/link";

import { Clock } from "lucide-react";

import TrackerImage from "@shared/assets/micodus.jpg";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Skeleton } from "@shared/components/ui/skeleton";
import { DeviceActions } from "@shared/features/device/device-actions";
import { FlespiBadge } from "@shared/features/device/device-badges";
import { deviceHref } from "@shared/features/device/device-links";
import { formatRelative } from "@shared/lib/format";
import type { Device } from "@shared/types/device";

export function InUseSection({ devices, loading }: { devices: Device[]; loading: boolean }) {
  return (
    <section className="flex flex-col gap-2" aria-labelledby="in-use-heading">
      <div className="flex items-center justify-between">
        <h2 id="in-use-heading" className="font-medium text-lg">
          Trackers en cours d'utilisation
        </h2>
        <span className="text-muted-foreground text-sm">{loading ? "…" : `${devices.length} trackers`}</span>
      </div>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: squelettes statiques
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-muted-foreground text-sm">
          Aucun tracker actif pour le moment.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {devices.map((device) => (
            <Card key={device.id} size="sm">
              <CardHeader>
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Image src={TrackerImage} alt="" className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle className="truncate font-mono leading-none">
                      <Link href={deviceHref(device.id)} prefetch={false} className="hover:underline">
                        {device.imei}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {device.model} · {device.simMsisdn ?? "SIM inconnue"}
                    </CardDescription>
                  </div>
                </div>
                <CardAction>
                  <DeviceActions device={device} variant="full" />
                </CardAction>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3 text-muted-foreground text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>
                    {device.lastSeenAt
                      ? `vu ${formatRelative(device.lastSeenAt)}`
                      : `mis à jour ${formatRelative(device.updatedAt)}`}
                  </span>
                </div>
                <FlespiBadge device={device} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
