import type { ComponentType, ReactNode } from "react";

import { cookies } from "next/headers";

import { cn } from "cn";

import { AccessProvider } from "@shared/components/providers/access-provider";
import { RealtimeProvider } from "@shared/components/providers/realtime-provider";
import { Separator } from "@shared/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@shared/components/ui/sidebar";
import { AccountSwitcher } from "@shared/features/common/header/account-switcher";
import { AlertCounter } from "@shared/features/common/header/alert-counter";
import DateTimer from "@shared/features/common/header/date-timer";
import { LevelBadge } from "@shared/features/common/header/level-badge";
import { RealtimeStatus } from "@shared/features/common/header/realtime-status";
import { ThemeSwitcher } from "@shared/features/common/header/theme-switcher";
import { ACCESS_LEVEL_COOKIE, type AccessLevel, parseLevel } from "@shared/lib/access/levels";
import type { SidebarCollapsible, SidebarVariant } from "@shared/lib/preferences/layout";
import { getPreference } from "@shared/server/server-actions";

/** Barre latérale de l'application : un composant client qui connaît SES entrées de menu. */
export type AppSidebarComponent = ComponentType<{ variant: SidebarVariant; collapsible: SidebarCollapsible }>;

/**
 * Coquille des tableaux de bord, commune aux trois applications (composant serveur).
 *
 * Chaque application fournit son niveau (`appLevel`) et sa barre latérale ;
 * la coquille apporte l'en-tête, le contrôle d'accès (`AccessProvider`) et le
 * flux temps réel (`RealtimeProvider`).
 */
export async function DashboardShell({
  children,
  appLevel,
  Sidebar,
}: Readonly<{ children: ReactNode; appLevel: AccessLevel; Sidebar: AppSidebarComponent }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  // Niveau d'accès (1, 2, 3) : premier rendu identique côté serveur et client.
  const initialLevel = parseLevel(cookieStore.get(ACCESS_LEVEL_COOKIE)?.value);
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant"),
    getPreference("sidebar_collapsible"),
  ]);

  return (
    <AccessProvider appLevel={appLevel} initialLevel={initialLevel}>
      <RealtimeProvider>
        <SidebarProvider
          defaultOpen={defaultOpen}
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 68)",
            } as React.CSSProperties
          }
        >
          <Sidebar variant={variant} collapsible={collapsible} />
          <SidebarInset
            className={cn(
              "[html[data-content-layout=centered]_&>*]:mx-auto",
              "[html[data-content-layout=centered]_&>*]:w-full",
              "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
              "peer-data-[variant=inset]:border",
              "[--dashboard-header-height:--spacing(12)]",
              "min-w-0 overflow-x-clip",
            )}
          >
            <header
              className={cn(
                "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
                // Handle sticky navbar style with conditional classes so blur, background, z-index, and rounded corners remain consistent across all SidebarVariant layouts.
                "[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
              )}
            >
              <div className="flex w-full items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-1 lg:gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
                  />
                  <LevelBadge />
                </div>
                <div className="flex items-center gap-4">
                  <RealtimeStatus />
                  <DateTimer />
                  <AlertCounter />
                  <ThemeSwitcher />
                  <AccountSwitcher />
                </div>
              </div>
            </header>
            {/* Pages can set data-content-padding="false" to render full-bleed app layouts. */}
            <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </RealtimeProvider>
    </AccessProvider>
  );
}
