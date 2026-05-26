"use client";

/**
 * AdminTopBar — client component.
 *
 * Top bar for the admin dashboard with:
 *  - Page title (from document.title on client)
 *  - Current user avatar + name
 *  - Sign-out button
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, UserIcon } from "lucide-react";
import { signOutAction } from "./actions";
import type { Profile } from "@/lib/utils/permissions";

interface AdminTopBarProps {
  profile: Profile;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function AdminTopBar({ profile }: AdminTopBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
      router.push("/en/sign-in");
      router.refresh();
    });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        {/* Mobile brand placeholder — full mobile nav is a future enhancement */}
        <span className="font-bold text-secondary">WC Admin</span>
      </div>

      <div className="ms-auto flex items-center gap-3">
        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2"
              aria-label="Account menu"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-xs font-semibold text-white">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:block">
                {profile.full_name ?? profile.id.slice(0, 8)}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/en/account" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" aria-hidden="true" />
                My Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleSignOut}
              disabled={isPending}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <LogOutIcon className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Signing out…" : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
