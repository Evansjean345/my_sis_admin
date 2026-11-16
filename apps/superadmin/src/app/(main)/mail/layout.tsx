import type { ReactNode } from "react";

import { SidebarProvider } from "@shared/components/ui/sidebar";
import { MailSidebar } from "@shared/features/mail/mail-sidebar";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative h-full">
      <SidebarProvider className="h-full min-h-0">
        <MailSidebar />
        <div className="size-full">{children}</div>
      </SidebarProvider>
    </div>
  );
}
