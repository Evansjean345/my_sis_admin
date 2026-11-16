"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@shared/components/ui/button";
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
import { Spinner } from "@shared/components/ui/spinner";
import { Switch } from "@shared/components/ui/switch";
import { useUpdateChannel } from "@shared/hooks/api/use-flespi";
import { getErrorMessage } from "@shared/lib/axios";
import type { FlespiChannel, UpdateChannelPayload } from "@shared/types/flespi";

const NAME = /^[\w.\- ]+$/;

export function ChannelEditDialog({
  channel,
  open,
  onOpenChange,
}: {
  channel: FlespiChannel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateChannel();
  const [name, setName] = useState(channel.name);
  const [ttlDays, setTtlDays] = useState(String(channel.messages_ttl / 86400));
  const [enabled, setEnabled] = useState(channel.enabled);

  useEffect(() => {
    if (open) {
      setName(channel.name);
      setTtlDays(String(channel.messages_ttl / 86400));
      setEnabled(channel.enabled);
    }
  }, [open, channel]);

  const ttl = Math.round(Number(ttlDays) * 86400);
  const nameInvalid = name.trim().length < 2 || !NAME.test(name.trim());
  const ttlInvalid = !Number.isFinite(ttl) || ttl < 0 || ttl > 31536000;

  function submit() {
    const payload: UpdateChannelPayload = {};
    if (name.trim() !== channel.name) payload.name = name.trim();
    if (ttl !== channel.messages_ttl) payload.messagesTtl = ttl;
    if (enabled !== channel.enabled) payload.enabled = enabled;
    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }
    update.mutate(
      { id: channel.id, payload },
      {
        onSuccess: () => {
          toast.success("Canal mis à jour", { description: name });
          onOpenChange(false);
        },
        onError: (error) => toast.error("Mise à jour impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !update.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le canal</DialogTitle>
          <DialogDescription className="font-mono">{channel.uri}</DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field className="gap-1.5" data-invalid={nameInvalid}>
            <FieldLabel htmlFor="channel-edit-name">Nom</FieldLabel>
            <Input id="channel-edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            <FieldDescription>Lettres, chiffres, espaces, « . », « - » et « _ ».</FieldDescription>
          </Field>
          <Field className="gap-1.5" data-invalid={ttlInvalid}>
            <FieldLabel htmlFor="channel-edit-ttl">Rétention du tampon (jours)</FieldLabel>
            <Input
              id="channel-edit-ttl"
              type="number"
              min={0}
              max={365}
              step="0.5"
              value={ttlDays}
              onChange={(e) => setTtlDays(e.target.value)}
            />
            <FieldDescription>0 = pas de stockage (flux MQTT uniquement). 365 jours maximum.</FieldDescription>
          </Field>
          <Field orientation="horizontal" className="rounded-lg border p-3">
            <FieldContent>
              <FieldLabel htmlFor="channel-edit-enabled">Canal actif</FieldLabel>
              <FieldDescription>Désactiver coupe la réception pour tous les boîtiers du canal.</FieldDescription>
            </FieldContent>
            <Switch id="channel-edit-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" disabled={update.isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={nameInvalid || ttlInvalid || update.isPending}>
            {update.isPending ? <Spinner data-icon="inline-start" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
