"use client";

import { useEffect, useMemo, useState } from "react";

import { ChevronDown, TerminalSquare } from "lucide-react";

import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@shared/components/ui/collapsible";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@shared/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Spinner } from "@shared/components/ui/spinner";
import { Textarea } from "@shared/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@shared/components/ui/toggle-group";
import { notifyCommandError, notifyCommandResult } from "@shared/features/common/commands/command-feedback";
import { CRITICAL_RAW_COMMANDS } from "@shared/features/device/command-config";
import { useFlespiCommandCatalog, useSendRawCommand } from "@shared/hooks/api/use-commands";
import type { CommandMode } from "@shared/types/command";

function exampleProperties(example: unknown): string {
  if (example && typeof example === "object" && "properties" in example) {
    return JSON.stringify((example as { properties: unknown }).properties ?? {}, null, 2);
  }
  return "{}";
}

/**
 * Commande flespi BRUTE (POST /devices/:id/commands/send), validée par
 * l'API contre le catalogue réel du boîtier, puis synchronisée.
 */
export function RawCommandCard({ deviceId }: { deviceId: string }) {
  const [open, setOpen] = useState(false);
  const catalog = useFlespiCommandCatalog(deviceId, open);
  const send = useSendRawCommand();

  const [name, setName] = useState("");
  const [properties, setProperties] = useState("{}");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<CommandMode>("queue");
  const [confirm, setConfirm] = useState(false);

  const definition = useMemo(() => catalog.data?.find((c) => c.name === name), [catalog.data, name]);
  const critical = CRITICAL_RAW_COMMANDS.has(name);

  useEffect(() => {
    setProperties(exampleProperties(definition?.examples?.[0]));
    setConfirm(false);
  }, [definition]);

  let parsed: Record<string, unknown> | null = null;
  let jsonError: string | null = null;
  try {
    const value = JSON.parse(properties || "{}");
    if (value && typeof value === "object" && !Array.isArray(value)) parsed = value as Record<string, unknown>;
    else jsonError = "Un objet JSON est attendu.";
  } catch {
    jsonError = "JSON invalide.";
  }

  const reasonError = reason.trim().length > 0 && reason.trim().length < 5 ? "5 caractères minimum." : null;
  const canSend = Boolean(name) && parsed !== null && reason.trim().length >= 5 && (!critical || confirm);

  function submit() {
    if (!canSend || !parsed) return;
    send.mutate(
      {
        deviceId,
        payload: { name, properties: parsed, reason: reason.trim(), mode, confirm: critical ? confirm : undefined },
      },
      {
        onSuccess: (executed) => {
          notifyCommandResult(name, executed);
          setReason("");
          setConfirm(false);
        },
        onError: (error) => notifyCommandError(name, error),
      },
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <button type="button" className="group flex w-full items-center justify-between gap-2 text-left">
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2">
                  <TerminalSquare className="size-4" />
                  Commande avancée (flespi)
                </CardTitle>
                <CardDescription>
                  Toutes les commandes publiées par flespi pour ce boîtier (réglages setting.*, custom…).
                </CardDescription>
              </div>
              <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="raw-name">Commande</FieldLabel>
                  <Select value={name} onValueChange={setName} disabled={catalog.isPending}>
                    <SelectTrigger id="raw-name" className="w-full">
                      <SelectValue placeholder={catalog.isPending ? "Chargement du catalogue…" : "Choisir"} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-80">
                      <SelectGroup>
                        {(catalog.data ?? []).map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            <span className="font-mono text-xs">{c.name}</span>
                            {c.title ? <span className="text-muted-foreground"> — {c.title}</span> : null}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {catalog.isError ? <FieldError>Catalogue flespi indisponible.</FieldError> : null}
                  {definition?.description ? <FieldDescription>{definition.description}</FieldDescription> : null}
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel>Mode d'envoi</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    spacing={0}
                    value={mode}
                    onValueChange={(v) => v && setMode(v as CommandMode)}
                  >
                    <ToggleGroupItem value="queue">File d'attente</ToggleGroupItem>
                    <ToggleGroupItem value="instant">Instantané</ToggleGroupItem>
                  </ToggleGroup>
                  <FieldDescription>
                    {mode === "queue"
                      ? "Remise dès que le boîtier se connecte."
                      : "Exécution immédiate : échoue si le boîtier est déconnecté."}
                  </FieldDescription>
                </Field>
              </div>

              <Field className="gap-1.5" data-invalid={Boolean(jsonError)}>
                <FieldLabel htmlFor="raw-properties">Propriétés (JSON)</FieldLabel>
                <Textarea
                  id="raw-properties"
                  className="min-h-28 font-mono text-xs"
                  value={properties}
                  onChange={(e) => setProperties(e.target.value)}
                  aria-invalid={Boolean(jsonError)}
                />
                {jsonError ? <FieldError>{jsonError}</FieldError> : null}
              </Field>

              <Field className="gap-1.5" data-invalid={Boolean(reasonError)}>
                <FieldLabel htmlFor="raw-reason">Motif</FieldLabel>
                <Textarea
                  id="raw-reason"
                  placeholder="Vérification APN recette"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-invalid={Boolean(reasonError)}
                />
                {reasonError ? <FieldError>{reasonError}</FieldError> : null}
              </Field>

              {critical ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    <Field orientation="horizontal">
                      <Checkbox id="raw-confirm" checked={confirm} onCheckedChange={(v) => setConfirm(Boolean(v))} />
                      <FieldContent>
                        <FieldLabel htmlFor="raw-confirm" className="font-normal">
                          Je confirme : une valeur erronée (serveur, APN) rend le boîtier injoignable à distance.
                        </FieldLabel>
                      </FieldContent>
                    </Field>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button onClick={submit} disabled={!canSend || send.isPending}>
                  {send.isPending ? <Spinner data-icon="inline-start" /> : null}
                  {send.isPending ? "Envoi et synchronisation…" : "Envoyer la commande"}
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
