"use client";

import { BellRingIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const THEME_CYCLE = ["light", "dark", "system"] as const;

export function AlertCounter() {
  return (
    <Button size="icon">
      <BellRingIcon />
    </Button>
  );
}
