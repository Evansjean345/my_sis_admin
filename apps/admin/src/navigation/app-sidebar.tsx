"use client";

import type { ComponentProps } from "react";

import { AppSidebar as SharedAppSidebar } from "@shared/features/common/sidebar/app-sidebar";

import { sidebarItems } from "./sidebar-items";

/** Barre latérale de l'Espace Administration : le menu partagé, avec les entrées de CETTE application. */
export function AppSidebar(props: Omit<ComponentProps<typeof SharedAppSidebar>, "items">) {
  return <SharedAppSidebar {...props} items={sidebarItems} />;
}
