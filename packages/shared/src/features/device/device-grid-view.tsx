import Image from "next/image";
import Link from "next/link";

import trackerImage from "@shared/assets/micodus.jpg";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { DeviceActions } from "@shared/features/device/device-actions";
import { DeviceStatusBadge, FlespiBadge } from "@shared/features/device/device-badges";
import { deviceHref } from "@shared/features/device/device-links";
import { formatDate } from "@shared/lib/format";
import type { Device } from "@shared/types/device";

export function DeviceGridView({ devices }: { devices: Device[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {devices.map((device) => (
        <Card key={device.id} size="sm">
          <CardContent>
            <Link
              href={deviceHref(device.id)}
              prefetch={false}
              className="relative flex h-36 items-center justify-center rounded-lg bg-muted/50"
            >
              <Image src={trackerImage} alt={`Tracker ${device.model}`} className="size-full object-contain p-2" />
              <span className="absolute top-2 left-2">
                <DeviceStatusBadge status={device.status} />
              </span>
            </Link>
          </CardContent>
          <CardHeader>
            <CardTitle className="truncate font-mono">{device.imei}</CardTitle>
            <CardDescription className="truncate">
              {device.organization ? (
                <span className="font-medium text-foreground">{device.organization.name} · </span>
              ) : null}
              {device.model} · <span className="capitalize">{device.manufacturer}</span> ·{" "}
              {formatDate(device.createdAt)}
            </CardDescription>
            <CardAction>
              <DeviceActions device={device} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <FlespiBadge device={device} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
