"use client";

import { productName } from "@bulaa/design";
import { Button } from "@bulaa/ui";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, type AuthUser } from "@/lib/api";
import { formatMnt } from "@/lib/money";

export function PlayHeader({
  user,
  balanceMnt,
}: {
  user: AuthUser;
  balanceMnt: number | null;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    queryClient.setQueryData(["auth", "me"], null);
    router.replace("/");
  }

  return (
    <header className="border-b border-border bg-void">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-text transition-colors hover:text-primary"
          >
            {productName}
          </Link>
          <span className="h-5 w-px bg-border" aria-hidden />
          <span className="font-display text-[15px] font-semibold text-text-muted">
            Play
          </span>
        </div>

        <div className="flex items-center gap-3">
          {balanceMnt !== null && (
            <span className="tabular-money text-[15px] font-medium">
              {formatMnt(balanceMnt)}
            </span>
          )}
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-7 rounded-sm border border-border"
            />
          )}
          <span className="hidden text-[13px] text-text-muted sm:inline">
            {user.displayName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            aria-label="Гарах"
          >
            <SignOut weight="bold" />
            <span className="hidden sm:inline">Гарах</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
