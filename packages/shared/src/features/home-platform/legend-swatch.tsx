import type { CSSProperties } from "react";

/**
 * Pastille de légende hors `ChartContainer` : les variables `--color-*` n'y
 * existent pas, on repasse donc la paire clair/sombre de la palette.
 * `shape="line"` pour les séries tracées en ligne, `rect` pour les aires et barres.
 */
export function LegendSwatch({
  theme,
  shape = "rect",
}: {
  theme: { light: string; dark: string };
  shape?: "rect" | "line";
}) {
  return (
    <span
      aria-hidden="true"
      style={{ "--sw-l": theme.light, "--sw-d": theme.dark } as CSSProperties}
      className={
        shape === "line"
          ? "mt-2 h-0.5 w-3.5 shrink-0 rounded-full bg-(--sw-l) dark:bg-(--sw-d)"
          : "mt-1 size-2.5 shrink-0 rounded-sm bg-(--sw-l) dark:bg-(--sw-d)"
      }
    />
  );
}
