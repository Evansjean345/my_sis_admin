"use client";

import Link from "next/link";

import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link prefetch={false} href="/dashboard/default">
              {collapsible && variant ? (
                <div className="flex items-center justify-start gap-4 w-full">
                  <div className="text-[#F8FAFC] text-xl font-extrabold">SISBM CORE</div>
                  <div className="flex justify-evenly items-center p-1 border border-[#10B981] w-12 h-4 rounded-2xl">
                    <div className="rounded-full h-1 w-1 bg-[#10B981] animate-ping" />
                    <div className="text-[10px] text-[#10B981] font-extrabold">live</div>
                  </div>
                </div>
              ) : (
                <></>
              )}
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        {/*<SupportCard /> */}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
