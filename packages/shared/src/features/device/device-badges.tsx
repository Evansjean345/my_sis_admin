import { CloudOff, Zap } from "lucide-react";

import { StatusBadge } from "@shared/components/status-badge";
import { deviceStatusMeta } from "@shared/components/status-labels";
import type { Device } from "@shared/types/device";

export function DeviceStatusBadge({ status }: { status: Device["status"] }) {
  const meta = deviceStatusMeta[status] ?? { label: status, tone: "neutral" as const };
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function FlespiBadge({ device }: { device: Device }) {
  return device.flespiDeviceId ? (
    <StatusBadge tone="success" dot={false}>
      <Zap className="size-3" />
      flespi
    </StatusBadge>
  ) : (
    <StatusBadge tone="warning" dot={false}>
      <CloudOff className="size-3" />
      non rattaché
    </StatusBadge>
  );
}
