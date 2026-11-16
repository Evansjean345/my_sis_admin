"use client";

import { useEffect, useState } from "react";

import { CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { Spinner } from "@shared/components/ui/spinner";
import { useCreateChannel } from "@shared/hooks/api/use-flespi";
import { getErrorMessage } from "@shared/lib/axios";
import type { CreateChannelMeta, FlespiChannel } from "@shared/types/flespi";

const NAME = /^[\w.\- ]+$/;

export function ChannelCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateChannel();
  const [name, setName] = useState("");
  const [protocolName, setProtocolName] = useState("micodus");
  const [result, setResult] = useState<{ channel: FlespiChannel; meta?: CreateChannelMeta } | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setProtocolName("micodus");
      setResult(null);
      create.reset();
    }
  }, [open, create.reset]);

  const nameInvalid = name.trim() !== "" && (name.trim().length < 2 || !NAME.test(name.trim()));
  const protocolInvalid = !/^[a-z0-9_-]+$/.test(protocolName.trim().toLowerCase());

  function submit() {
    create.mutate(
      { name: name.trim(), protocolName: protocolName.trim().toLowerCase() },
      { onSuccess: (res) => setResult({ channel: res.data, meta: res.meta }) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau canal flespi</DialogTitle>
          <DialogDescription>Un seul canal suffit pour toute une flotte du même protocole.</DialogDescription>
        </DialogHeader>

        {result ? (
          <Alert>
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertTitle>
              Canal {result.channel.name} créé · <span className="font-mono">{result.channel.uri}</span>
            </AlertTitle>
            <AlertDescription>
              <ol className="mt-1 list-decimal space-y-1 pl-4">
                {(result.meta?.nextSteps ?? []).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </AlertDescription>
          </Alert>
        ) : (
          <FieldGroup className="gap-4">
            <Field className="gap-1.5" data-invalid={nameInvalid}>
              <FieldLabel htmlFor="channel-name">Nom du canal</FieldLabel>
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="sisbm_channel"
              />
              {nameInvalid ? <FieldError>2 caractères min. ; lettres, chiffres, espaces, . - _</FieldError> : null}
            </Field>
            <Field className="gap-1.5" data-invalid={protocolInvalid}>
              <FieldLabel htmlFor="channel-protocol">Protocole</FieldLabel>
              <Input id="channel-protocol" value={protocolName} onChange={(e) => setProtocolName(e.target.value)} />
              <FieldDescription>« micodus » pour les MV730.</FieldDescription>
            </Field>
            {create.isError ? <FieldError>{getErrorMessage(create.error)}</FieldError> : null}
          </FieldGroup>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => onOpenChange(false)}>Terminer</Button>
          ) : (
            <>
              <Button variant="outline" disabled={create.isPending} onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={submit} disabled={!name.trim() || nameInvalid || protocolInvalid || create.isPending}>
                {create.isPending ? <Spinner data-icon="inline-start" /> : null}
                Créer le canal
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
