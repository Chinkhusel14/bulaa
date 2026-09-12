"use client";

import { productName } from "@bulaa/design";
import { Button } from "@bulaa/ui";
import { SteamLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useAuth } from "../../lib/use-auth";
import { logout } from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3101";

const navLinks = [
  { href: "#features", label: "Онцлог", labelEn: "Features" },
  { href: "#how-it-works", label: "Яаж ажилладаг", labelEn: "How it works" },
] as const;

export function SiteHeader() {
  const { data: user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    queryClient.setQueryData(["auth", "me"], null);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-void/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6 sm:px-10">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-text transition-colors hover:text-primary"
        >
          {productName}
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group flex flex-col text-[13px] leading-4 text-text-muted transition-colors hover:text-text"
            >
              <span>{link.label}</span>
              <span className="text-[11px] text-text-faint group-hover:text-text-muted">
                {link.labelEn}
              </span>
            </a>
          ))}
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="size-7 rounded-sm border border-border"
              />
            )}
            <span className="hidden text-[13px] text-text-muted sm:inline">
              {user.displayName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Гарах
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" className="shrink-0" asChild>
            <a href={`${API_URL}/api/auth/steam`}>
              <SteamLogo data-icon="inline-start" weight="bold" />
              <span className="hidden sm:inline">Steam-ээр нэвтрэх</span>
              <span className="sm:hidden">Нэвтрэх</span>
            </a>
          </Button>
        )}
      </div>
    </header>
  );
}
