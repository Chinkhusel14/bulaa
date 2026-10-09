"use client";

import type { LobbyRoom, LobbyStatus, LobbySummary } from "@bulaa/shared";
import { LOBBY_SEAT_COUNT, winnerPayoutMnt } from "@bulaa/shared/constants";
import { cn } from "@bulaa/ui";
import { CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Money, SeatMeter } from "./lobby-kit";

const STATUS_LABEL: Partial<Record<LobbyStatus, string>> = {
  open: "Open",
  accepting: "Accepting",
  veto: "Ban / pick",
  awaiting_server: "Server",
  live: "Live",
  awaiting_result: "Result",
};

export function PlaySidebarLobbyCard({
  lobbyId,
  summary,
  room,
  active,
}: {
  lobbyId: string;
  summary: LobbySummary | null;
  room: LobbyRoom | undefined;
  active: boolean;
}) {
  const occupancy = room?.players.length ?? summary?.occupancy ?? 0;
  const readyCount =
    room?.players.filter((p) => p.ready).length ?? summary?.readyCount ?? 0;
  const viewerReady = room?.players.find((p) => p.userId === room.viewerUserId)?.ready;
  const status = room?.status;
  const prize = winnerPayoutMnt(room?.prizePoolMnt ?? summary?.prizePoolMnt ?? 0);
  const host = summary?.hostDisplayName;

  return (
    <Link
      href={`/play/${lobbyId}`}
      className={cn(
        "border-border bg-raised block rounded-sm border p-3 transition-colors",
        active ? "border-primary/40 bg-primary-muted/30" : "hover:bg-overlay",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-text-muted text-[11px] font-medium uppercase tracking-wide">
            Таны лобби / Your lobby
          </p>
          {host && (
            <p className="text-text mt-0.5 truncate text-[13px] font-medium">{host}</p>
          )}
        </div>
        {status && (
          <span className="text-text-muted shrink-0 text-[11px]">{STATUS_LABEL[status] ?? status}</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <SeatMeter occupancy={occupancy} ready={readyCount} />
        <span className="text-text-muted font-mono text-[12px] tabular-nums">
          {occupancy}/{LOBBY_SEAT_COUNT}
        </span>
        <span className="text-text-faint text-[12px]">·</span>
        <span className="text-text-muted font-mono text-[12px] tabular-nums">
          {readyCount} ready
        </span>
      </div>

      {viewerReady !== undefined && status === "open" && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 text-[12px]",
            viewerReady ? "text-primary" : "text-text-muted",
          )}
        >
          {viewerReady ? (
            <CheckCircle weight="fill" className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <Circle className="size-3.5 shrink-0" aria-hidden />
          )}
          {viewerReady ? "Та бэлэн / You are ready" : "Бэлэн биш / Not ready"}
        </p>
      )}

      <p className="mt-2 text-[12px]">
        <span className="text-text-muted">Win </span>
        <Money amount={prize} className="inline text-[12px]" />
      </p>
    </Link>
  );
}
