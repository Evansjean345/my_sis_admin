import type { ReactNode } from "react";

import { SidebarProvider } from "@shared/components/ui/sidebar";
import { ChatHeader } from "@shared/features/chat/chat-header";
import { ChatSidebar } from "@shared/features/chat/chat-sidebar";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <ChatHeader />
        <div className="flex flex-1">
          <ChatSidebar />
          {children}
        </div>
      </SidebarProvider>
    </div>
  );
}
