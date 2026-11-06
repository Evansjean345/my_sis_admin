"use client";

import Link from "next/link";

import { ArrowBigDown, BadgeCheck, ChevronDown, ChevronUp, FileTextIcon, KeyRound, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useLogout } from "@/hooks/api/use-auth";
import { useRolesMap } from "@/hooks/api/use-roles";
import { getInitials } from "@/lib/utils";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: user, isPending } = useCurrentUser();
  const roles = useRolesMap();
  const logout = useLogout();

  if (isPending) {
    return <Skeleton className="h-12 w-full rounded-lg" />;
  }

  const name = user?.fullName ?? "Utilisateur";
  const roleName = user ? (roles.get(user.roleId)?.name ?? "") : "";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex justify-evenly items-center p-2 border rounded-lg">
              <div>
                <button
                  type="button"
                  className="outline-none focus-visible:ring-2 focus-visible bg-[#102b46] h-10 w-10 rounded-full text-[12px]"
                  aria-label="Menu du compte"
                >
                  {getInitials(name)}
                </button>
              </div>
              <div>
                <div className="text-[10px]">{name}</div>
                <div className="text-[8px]">{roleName}</div>
              </div>
              <ChevronUp className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <div>
                  <button
                    type="button"
                    className="outline-none focus-visible:ring-2 focus-visible bg-[#102b46] text-white h-10 w-10 rounded-full text-[12px]"
                    aria-label="Menu du compte"
                  >
                    {getInitials(name)}
                  </button>
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight text-[#102b46]">
                  <span className="truncate font-semibold ">{name}</span>
                  <span className="truncate text-muted-foreground text-xs">{user?.email}</span>
                  {roleName ? <span className="truncate text-xs">{roleName}</span> : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" prefetch={false}>
                  <BadgeCheck />
                  Mon compte
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Formule simulée</DropdownMenuItem>
              <DropdownMenuItem className="text-[12px] text-white hover:text-white">
                <div className="flex justify-between gap-2">
                  <div className="bg-[#0E508D] p-2 rounded-lg hover:cursor-pointer hover:text-white hover:scale-90 transition-all">
                    Standard
                  </div>
                  <div className="bg-[#0E508D] p-2 rounded-lg hover:cursor-pointer hover:text-white hover:scale-90 transition-all">
                    Gold
                  </div>
                  <div className="bg-[#0E508D] p-2 rounded-lg hover:cursor-pointer hover:text-white hover:scale-90 transition-all">
                    Premuim
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>Choisissez votre formule d'abonnements</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile?tab=security" prefetch={false}>
                  <KeyRound />
                  Changer le mot de passe
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/audit" prefetch={false}>
                  <FileTextIcon />
                  Journal d'activité
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={logout.isPending} onClick={() => logout.mutate()} className="text-red-500">
              <LogOut />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
