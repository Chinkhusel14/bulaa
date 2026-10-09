"use client";

import { productName } from "@bulaa/design";
import { Button, cn } from "@bulaa/ui";
import type { LobbyListResponse } from "@bulaa/shared";
import {
  List,
  MagnifyingGlass,
  SignOut,
  UsersThree,
  X,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logout, type AuthUser } from "@/lib/api";
import { useLobbies, useLobbyRoom } from "@/lib/lobbies";
import { formatMnt } from "@/lib/money";
import { useAuth } from "@/lib/use-auth";
import { DevPersonaMenu } from "./dev-persona-menu";
import { PlaySidebarLobbyCard } from "./play-sidebar-lobby";

function NavItem({
  href,
  label,
  sublabel,
  active,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  sublabel: string;
  active: boolean;
  icon: typeof MagnifyingGlass;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-colors",
        active
          ? "bg-primary-muted text-text border-primary/30 border"
          : "text-text-muted hover:bg-overlay hover:text-text",
      )}
    >
      <Icon
        weight={active ? "fill" : "regular"}
        className={cn("size-5 shrink-0", active && "text-primary")}
        aria-hidden
      />
      <span>
        <span className="block text-[14px] font-medium">{label}</span>
        <span className="block text-[11px] opacity-80">{sublabel}</span>
      </span>
    </Link>
  );
}

function SidebarBody({
  user,
  balanceMnt,
  lobbiesData,
  activeLobbyId,
  roomLobbyId,
  onNavigate,
}: {
  user: AuthUser;
  balanceMnt: number | null;
  lobbiesData: LobbyListResponse | undefined;
  activeLobbyId: string | null;
  roomLobbyId: string | undefined;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const router = useRouter();
  const summary =
    activeLobbyId != null
      ? lobbiesData?.lobbies.find((l) => l.id === activeLobbyId) ?? null
      : null;
  const roomQuery = useLobbyRoom(activeLobbyId ?? "", activeLobbyId != null);
  const room = roomQuery.data;
  const browseActive = pathname === "/play";
  const roomActive = roomLobbyId != null && pathname === `/play/${roomLobbyId}`;

  async function handleLogout() {
    await logout();
    queryClient.setQueryData(["auth", "me"], null);
    router.replace("/");
  }

  return (
    <>
      <div className="border-border border-b px-4 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="font-display text-xl font-semibold tracking-tight text-text transition-colors hover:text-primary"
        >
          {productName}
        </Link>
        <p className="text-text-faint mt-1 text-[11px]">Paid CS2 5v5</p>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Play navigation">
        <NavItem
          href="/play"
          label="Лобби"
          sublabel="Browse lobbies"
          active={browseActive}
          icon={MagnifyingGlass}
          onNavigate={onNavigate}
        />
        {activeLobbyId && (
          <NavItem
            href={`/play/${activeLobbyId}`}
            label="Өрөө"
            sublabel="Lobby room"
            active={roomActive}
            icon={UsersThree}
            onNavigate={onNavigate}
          />
        )}
      </nav>

      {activeLobbyId && (
        <div className="px-3 pb-2">
          <PlaySidebarLobbyCard
            lobbyId={activeLobbyId}
            summary={summary}
            room={room}
            active={roomActive}
          />
        </div>
      )}

      <div className="mt-auto border-border border-t px-4 py-4">
        {balanceMnt !== null && (
          <p className="mb-3">
            <span className="text-text-muted block text-[11px]">Хэтэвч / Wallet</span>
            <span className="tabular-money text-money text-[18px] font-medium leading-6">
              {formatMnt(balanceMnt)}
            </span>
          </p>
        )}

        <div className="flex items-center gap-2">
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-8 rounded-sm border border-border"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-text truncate text-[13px] font-medium">{user.displayName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Гарах / Sign out">
            <SignOut weight="bold" />
          </Button>
        </div>
        <div className="mt-2">
          <DevPersonaMenu currentUserId={user.id} />
        </div>
      </div>
    </>
  );
}

export function PlayShell({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const canView = !!user && user.status !== "pending_phone";
  const lobbies = useLobbies(canView);

  const roomMatch = pathname.match(/^\/play\/([^/]+)$/);
  const roomLobbyId = roomMatch?.[1];
  const viewerLobbyId = lobbies.data?.viewer.lobbyId ?? null;
  const activeLobbyId = roomLobbyId ?? viewerLobbyId;
  const balanceMnt = lobbies.data?.viewer.balanceMnt ?? null;

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/");
    else if (user.status === "pending_phone") router.replace("/auth/phone");
  }, [isLoading, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isLoading || !user || user.status === "pending_phone") return null;

  return (
    <div className="bg-void flex min-h-dvh">
      <aside className="border-border bg-base sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r lg:flex">
        <SidebarBody
          user={user}
          balanceMnt={balanceMnt}
          lobbiesData={lobbies.data}
          activeLobbyId={activeLobbyId}
          roomLobbyId={roomLobbyId}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-void/80"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="bg-base relative flex h-full w-[min(100%,16rem)] flex-col border-r border-border shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
            >
              <X weight="bold" />
            </Button>
            <SidebarBody
              user={user}
              balanceMnt={balanceMnt}
              lobbiesData={lobbies.data}
              activeLobbyId={activeLobbyId}
              roomLobbyId={roomLobbyId}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="border-border bg-base flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <List weight="bold" />
          </Button>
          <Link href="/play" className="font-display text-lg font-semibold text-text">
            {productName}
          </Link>
          {balanceMnt !== null && (
            <span className="tabular-money text-money text-[13px] font-medium">
              {formatMnt(balanceMnt)}
            </span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-20 sm:px-6 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        {activeLobbyId && (
          <nav
            className="border-border bg-base fixed inset-x-0 bottom-0 z-30 flex border-t lg:hidden"
            aria-label="Quick play navigation"
          >
            <Link
              href="/play"
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px]",
                pathname === "/play" ? "text-primary" : "text-text-muted",
              )}
            >
              <MagnifyingGlass
                weight={pathname === "/play" ? "fill" : "regular"}
                className="size-5"
              />
              Лобби
            </Link>
            <Link
              href={`/play/${activeLobbyId}`}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px]",
                roomLobbyId === activeLobbyId ? "text-primary" : "text-text-muted",
              )}
            >
              <UsersThree
                weight={roomLobbyId === activeLobbyId ? "fill" : "regular"}
                className="size-5"
              />
              Өрөө / Room
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
