"use client";

import { Button } from "@/components/ui/button";
import { BellRingIcon } from "lucide-react";

const THEME_CYCLE = ["light", "dark", "system"] as const;

export function AlertCounter() {
  return (
    <Button size="icon">
      <BellRingIcon />
    </Button>
  );
}
