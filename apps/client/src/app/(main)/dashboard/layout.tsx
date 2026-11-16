import type { ReactNode } from "react";

import { DashboardShell } from "@shared/features/common/shell/dashboard-shell";

import { APP_LEVEL } from "@/config/app";
import { AppSidebar } from "@/navigation/app-sidebar";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <DashboardShell appLevel={APP_LEVEL} Sidebar={AppSidebar}>
      {children}
    </DashboardShell>
  );
}
