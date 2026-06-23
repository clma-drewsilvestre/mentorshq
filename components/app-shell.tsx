"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";
import { ROLE_LABEL, isManagement } from "@/lib/constants";

type NavItem = { href: string; label: string; icon: LucideIcon; managerOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/admin/people", label: "Team", icon: Users, managerOnly: true },
];

function initials(name: string, email: string) {
  const base = name?.trim() || email;
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const manager = isManagement(profile.role);
  const items = NAV.filter((i) => !i.managerOnly || manager);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
        <Link href="/home" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="h-7 w-7" />
          <span className="font-display text-xl leading-none text-gold">Mentors HQ</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 border border-copper/40">
              <AvatarFallback className="bg-card text-xs text-bone">
                {initials(profile.full_name, profile.email)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate font-medium">{profile.full_name || profile.email}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {ROLE_LABEL[profile.role]}
                {profile.founding_team ? " · Founding team" : ""}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action="/auth/signout" method="post" className="p-1">
              <button
                type="submit"
                className="flex w-full items-center rounded-md px-1.5 py-1 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                Sign out
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-border/60 bg-background/90 backdrop-blur">
        <ul className="flex items-stretch justify-around">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 text-[11px] transition-colors",
                    active ? "text-gold" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.7} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
