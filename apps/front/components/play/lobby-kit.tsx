"use client";

import type { LobbyRole, LobbySummary, LobbyViewer, TierBand } from "@bulaa/shared";
import {
  LOBBY_ERROR_CODES,
  LOBBY_PRIZE_POOL_MAX_MNT,
  LOBBY_PRIZE_POOL_MIN_MNT,
  LOBBY_SEAT_COUNT,
  lobbyCostMnt,
  type LobbyErrorCode,
} from "@bulaa/shared/constants";
import { Button, cn } from "@bulaa/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { LOBBIES_QUERY_KEY, createLobby, joinLobby, leaveLobby } from "@/lib/lobbies";
import { formatMnt } from "@/lib/money";

export type Blocker = "banned" | "in_lobby" | "balance";

export interface Copy {
  mn: ReactNode;
  en: ReactNode;
}

export function Money({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn("tabular-money", className)}>{formatMnt(amount)}</span>;
}

export const BLOCKER_COPY: Record<Blocker, Copy> = {
  banned: {
    mn: "Таны бүртгэл хаагдсан. Лобби үзэх боломжтой.",
    en: "Account banned. You can view lobbies but not create or join.",
  },
  in_lobby: {
    mn: "Та лобби-д байна. Өөр лобби-д орохын өмнө гарна уу.",
    en: "You are in a lobby. Leave it to join another.",
  },
  balance: {
    mn: "Хэтэвчний үлдэгдэл хүрэлцэхгүй байна.",
    en: "Your wallet does not cover this lobby.",
  },
};

const BLOCKER_TITLE: Record<Blocker, string> = {
  banned: "Account banned",
  in_lobby: "Leave your lobby first",
  balance: "Wallet does not cover this lobby",
};

const ERROR_COPY: Record<LobbyErrorCode, Copy> = {
  unauthenticated: { mn: "Нэвтэрнэ үү.", en: "Sign in required." },
  banned: BLOCKER_COPY.banned,
  phone_required: {
    mn: "Утсаа баталгаажуулна уу.",
    en: "Verify your phone first.",
  },
  insufficient_balance: BLOCKER_COPY.balance,
  already_in_lobby: {
    mn: "Та аль хэдийн лобби-д байна.",
    en: "You are already in a lobby.",
  },
  lobby_full: { mn: "Лобби дүүрсэн.", en: "This lobby is full." },
  lobby_closed: { mn: "Лобби хаагдсан.", en: "This lobby is closed." },
  not_in_lobby: {
    mn: "Та энэ лобби-д байхгүй.",
    en: "You are not in this lobby.",
  },
  invalid_prize_pool: {
    mn: (
      <>
        Шагналын сан <Money amount={LOBBY_PRIZE_POOL_MIN_MNT} /> –{" "}
        <Money amount={LOBBY_PRIZE_POOL_MAX_MNT} /> байна.
      </>
    ),
    en: "Prize pool is out of range.",
  },
};

const FALLBACK_ERROR: Copy = {
  mn: "Алдаа гарлаа. Дахин оролдоно уу.",
  en: "Something went wrong. Try again.",
};

function errorCopy(code: string): Copy {
  return (LOBBY_ERROR_CODES as readonly string[]).includes(code)
    ? ERROR_COPY[code as LobbyErrorCode]
    : FALLBACK_ERROR;
}

/** Blocks every lobby at once. Per-lobby balance lives in `joinBlocker`. */
export function accountBlocker(status: string, viewer: LobbyViewer): Blocker | null {
  if (status === "banned") return "banned";
  if (viewer.lobbyId) return "in_lobby";
  return null;
}

export function joinCostMnt(lobby: LobbySummary): number {
  return lobbyCostMnt(lobby.prizePoolMnt, lobby.serverFeeMnt);
}

export function joinBlocker(
  lobby: LobbySummary,
  viewer: LobbyViewer,
  account: Blocker | null,
): Blocker | null {
  if (account) return account;
  return viewer.balanceMnt < joinCostMnt(lobby) ? "balance" : null;
}

export const TIER_BANDS: readonly TierBand[] = ["pro", "mid", "low"];

export function tierBarClass(band: TierBand): string {
  switch (band) {
    case "pro":
      return "bg-tier-pro";
    case "mid":
      return "bg-tier-mid";
    case "low":
      return "bg-tier-low";
    default: {
      const unhandled: never = band;
      return unhandled;
    }
  }
}

export function bandLabel(band: TierBand): string {
  switch (band) {
    case "pro":
      return "Top";
    case "mid":
      return "Mid";
    case "low":
      return "Lower";
    default: {
      const unhandled: never = band;
      return unhandled;
    }
  }
}

export function roleCopy(role: LobbyRole): Copy {
  switch (role) {
    case "host":
      return { mn: "Та хост", en: "You host" };
    case "member":
      return { mn: "Та энэ лобби-д байна", en: "You are in this lobby" };
    default: {
      const unhandled: never = role;
      return unhandled;
    }
  }
}

export function formatAge(createdAt: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function isFull(lobby: LobbySummary): boolean {
  return lobby.occupancy >= LOBBY_SEAT_COUNT;
}

/** Fullest first, then longest waiting: the lobby most likely to start next. */
export function byClosestToStart(a: LobbySummary, b: LobbySummary): number {
  return (
    b.occupancy - a.occupancy ||
    b.readyCount - a.readyCount ||
    a.createdAt.localeCompare(b.createdAt)
  );
}

export function useLobbyActions() {
  const queryClient = useQueryClient();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<Copy | null>(null);

  async function run(key: string, action: () => Promise<unknown>): Promise<boolean> {
    setPendingKey(key);
    setError(null);
    let ok = true;
    try {
      await action();
    } catch (e: unknown) {
      ok = false;
      setError(errorCopy(e instanceof Error ? e.message : ""));
    }
    await queryClient.invalidateQueries({ queryKey: LOBBIES_QUERY_KEY });
    setPendingKey(null);
    return ok;
  }

  return {
    pendingKey,
    error,
    busy: pendingKey !== null,
    clearError: () => setError(null),
    create: (prizePoolMnt: number) => run("create", () => createLobby(prizePoolMnt)),
    join: (id: string) => run(id, () => joinLobby(id)),
    leave: (id: string) => run(id, () => leaveLobby(id)),
  };
}

export type LobbyActions = ReturnType<typeof useLobbyActions>;

export function TierBadge({ label, band }: { label: string; band: TierBand }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("h-4 w-[3px] rounded-sm", tierBarClass(band))} aria-hidden />
      <span className="text-text whitespace-nowrap font-mono text-[13px]">{label}</span>
    </span>
  );
}

export function seatClass(index: number, occupancy: number, ready: number): string {
  if (index < ready) return "bg-primary";
  if (index < occupancy) return "bg-text-muted";
  return "bg-overlay";
}

function seatsLabel(occupancy: number, ready: number): string {
  return `${occupancy}/${LOBBY_SEAT_COUNT} players, ${ready}/${LOBBY_SEAT_COUNT} ready`;
}

/** Ten segments: ready in primary, joined in muted, open in overlay. */
export function SeatMeter({ occupancy, ready }: { occupancy: number; ready: number }) {
  return (
    <span role="img" aria-label={seatsLabel(occupancy, ready)} className="flex gap-0.5">
      {Array.from({ length: LOBBY_SEAT_COUNT }, (_, i) => (
        <span
          key={i}
          className={cn("h-3 w-1.5 rounded-sm", seatClass(i, occupancy, ready))}
        />
      ))}
    </span>
  );
}

export function SeatLegend() {
  return (
    <span className="text-text-faint flex flex-wrap items-center gap-x-3 gap-y-1 whitespace-nowrap text-[12px]">
      <span className="flex items-center gap-1.5">
        <span className="bg-primary size-2 rounded-sm" aria-hidden />
        Бэлэн / Ready
      </span>
      <span className="flex items-center gap-1.5">
        <span className="bg-text-muted size-2 rounded-sm" aria-hidden />
        Орсон / Joined
      </span>
      <span className="flex items-center gap-1.5">
        <span className="bg-overlay size-2 rounded-sm" aria-hidden />
        Сул / Open
      </span>
    </span>
  );
}

export function BlockerNotice({ blocker }: { blocker: Blocker }) {
  return (
    <div className="border-border-strong bg-raised flex flex-col gap-0.5 border-l-[3px] px-4 py-3">
      <p className="text-text text-[15px]">{BLOCKER_COPY[blocker].mn}</p>
      <p className="text-text-muted text-[13px]">{BLOCKER_COPY[blocker].en}</p>
    </div>
  );
}

export function ActionError({ error }: { error: Copy }) {
  return (
    <div className="flex flex-col gap-0.5" role="alert">
      <p className="text-danger text-[13px]">{error.mn}</p>
      <p className="text-text-muted text-[12px]">{error.en}</p>
    </div>
  );
}

export function LobbiesLoadError() {
  return (
    <p className="text-danger text-[13px]">
      Лобби ачаалж чадсангүй. Could not load lobbies.
    </p>
  );
}

export function LobbiesLoading() {
  return <p className="text-text-muted text-[13px]">Ачаалж байна...</p>;
}

/** Join or Leave for one lobby. */
export function SeatAction({
  lobby,
  viewer,
  account,
  actions,
  className,
}: {
  lobby: LobbySummary;
  viewer: LobbyViewer;
  account: Blocker | null;
  actions: LobbyActions;
  className?: string;
}) {
  const pending = actions.pendingKey === lobby.id;
  if (viewer.lobbyId === lobby.id) {
    return (
      <Button
        variant="secondary"
        size="lg"
        className={className}
        onClick={() => actions.leave(lobby.id)}
        disabled={actions.busy}
      >
        {pending ? "Гарч байна..." : "Гарах"}
      </Button>
    );
  }
  const blocker = joinBlocker(lobby, viewer, account);
  const full = isFull(lobby);
  return (
    <Button
      size="lg"
      className={className}
      onClick={() => actions.join(lobby.id)}
      disabled={actions.busy || blocker !== null || full}
      title={blocker ? BLOCKER_TITLE[blocker] : full ? "Lobby full" : undefined}
    >
      {pending ? "Нэгдэж байна..." : full ? "Дүүрсэн" : "Нэгдэх"}
    </Button>
  );
}
