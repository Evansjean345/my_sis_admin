"use client";

import { useEffect, useState } from "react";

import { Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@shared/components/ui/button";
import { Checkbox } from "@shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Spinner } from "@shared/components/ui/spinner";
import { useSyncDeviceFlespi } from "@shared/hooks/api/use-devices";
import { useChannels, useDeviceTypes, useFlespiHealth } from "@shared/hooks/api/use-flespi";
import { getErrorMessage } from "@shared/lib/axios";
import type { Device, SyncDeviceFlespiPayload } from "@shared/types/device";

/** POST /devices/:id/flespi/sync — rattacher après coup un tracker créé en stock. */
export function FlespiSyncDialog({
  device,
  open,
  onOpenChange,
}: {
  device: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const sync = useSyncDeviceFlespi();
  const channels = useChannels();
  const health = useFlespiHealth();
  const types = useDeviceTypes(health.data?.protocolName ?? "micodus", undefined, open);

  const [terminalId, setTerminalId] = useState("");
  const [flespiIdent, setFlespiIdent] = useState("");
  const [channelId, setChannelId] = useState("");
  const [deviceType, setDeviceType] = useState("Micodus MV730");
  const [name, setName] = useState("");
  const [linkExisting, setLinkExisting] = useState(true);

  const defaultChannel = device.flespiChannelId ?? health.data?.configuredChannelId ?? channels.data?.[0]?.id;

  useEffect(() => {
    if (open) {
      setTerminalId("");
      setFlespiIdent(device.flespiIdent ?? "");
      setName("");
      setLinkExisting(true);
      setDeviceType("Micodus MV730");
    }
  }, [open, device]);

  useEffect(() => {
    if (open && defaultChannel && !channelId) setChannelId(String(defaultChannel));
  }, [open, defaultChannel, channelId]);

  const terminalInvalid = terminalId !== "" && !/^\d{6,20}$/.test(terminalId);
  const identInvalid = flespiIdent !== "" && !/^[0-9A-Za-z]{4,30}$/.test(flespiIdent);
  const canSubmit = !terminalInvalid && !identInvalid && (terminalId !== "" || flespiIdent !== "");

  function submit() {
    const payload: SyncDeviceFlespiPayload = {
      terminalId: terminalId || undefined,
      flespiIdent: flespiIdent || undefined,
      flespiChannelId: channelId ? Number(channelId) : undefined,
      flespiDeviceType: deviceType || undefined,
      name: name.trim() || undefined,
      linkExisting,
    };
    sync.mutate(
      { id: device.id, payload },
      {
        onSuccess: (d) => {
          toast.success("Tracker rattaché à flespi", {
            description: `Device ${d.flespiDeviceId} · ident ${d.flespiIdent}`,
          });
          onOpenChange(false);
        },
        onError: (error) => toast.error("Rattachement impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !sync.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-4" />
            Rattacher à flespi
          </DialogTitle>
          <DialogDescription>
            Crée (ou relie) le device flespi du tracker <span className="font-mono">{device.imei}</span>.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="gap-1.5" data-invalid={terminalInvalid}>
              <FieldLabel htmlFor="sync-terminal">ID terminal (étiquette)</FieldLabel>
              <Input
                id="sync-terminal"
                value={terminalId}
                onChange={(e) => setTerminalId(e.target.value.trim())}
                placeholder="7301151405"
              />
              <FieldDescription>Micodus : ident = « 0 » + ID.</FieldDescription>
            </Field>
            <Field className="gap-1.5" data-invalid={identInvalid}>
              <FieldLabel htmlFor="sync-ident">Ident flespi exact</FieldLabel>
              <Input
                id="sync-ident"
                value={flespiIdent}
                onChange={(e) => setFlespiIdent(e.target.value.trim())}
                placeholder="07301151405"
              />
              <FieldDescription>Prioritaire sur l'ID terminal.</FieldDescription>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="sync-channel">Canal</FieldLabel>
              <Select value={channelId} onValueChange={setChannelId}>
                <SelectTrigger id="sync-channel" className="w-full">
                  <SelectValue placeholder="Canal par défaut" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {(channels.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} · {c.id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="sync-type">Type de boîtier</FieldLabel>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger id="sync-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  <SelectGroup>
                    {(
                      types.data?.deviceTypes ?? [{ id: 1198, title: "Micodus MV730", name: "mv730", protocol_id: 325 }]
                    ).map((t) => (
                      <SelectItem key={t.id} value={t.title}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="sync-name">Nom affiché</FieldLabel>
            <Input
              id="sync-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${device.model} ${device.imei}`}
            />
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="sync-link" checked={linkExisting} onCheckedChange={(v) => setLinkExisting(Boolean(v))} />
            <FieldContent>
              <FieldLabel htmlFor="sync-link" className="font-normal">
                Relier le device flespi existant s'il porte déjà cet ident
              </FieldLabel>
            </FieldContent>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" disabled={sync.isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!canSubmit || sync.isPending}>
            {sync.isPending ? <Spinner data-icon="inline-start" /> : null}
            Rattacher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
