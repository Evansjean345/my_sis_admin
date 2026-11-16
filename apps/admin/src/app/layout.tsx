import type { ReactNode } from "react";

import type { Metadata } from "next";

import { QueryProvider } from "@shared/components/providers/query-provider";
import { Toaster } from "@shared/components/ui/sonner";
import { TooltipProvider } from "@shared/components/ui/tooltip";
import { fontVars } from "@shared/lib/fonts/registry";
import { PREFERENCE_DEFAULTS } from "@shared/lib/preferences/preferences-config";
import { ThemeBootScript } from "@shared/scripts/theme-boot";
import { PreferencesStoreProvider } from "@shared/stores/preferences/preferences-provider";

import { APP_META } from "@/config/app";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_META.title,
  description: APP_META.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } =
    PREFERENCE_DEFAULTS;
  return (
    <html
      lang="fr"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        {/* Applies theme and layout preferences on load to avoid flicker and unnecessary server rerenders. */}
        <ThemeBootScript />
      </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <TooltipProvider>
          <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
