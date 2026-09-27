"use client";

import type {
  LobbyListResponse,
  LobbyRole,
  LobbySummary,
  LobbyViewer,
  TierBand,
} from "@bulaa/shared";
import {
  LOBBY_ENTRY_MNT,
  LOBBY_ERROR_CODES,
  LOBBY_NAME_MAX_LENGTH,
  LOBBY_SEAT_COUNT,
  type LobbyErrorCode,
} from "@bulaa/shared/constants";
import { Button, cn } from "@bulaa/ui";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/api";
import {
  LOBBIES_QUERY_KEY,
  createLobby,
  joinLobby,
  leaveLobby,
} from "@/lib/lobbies";
import { formatMnt } from "@/lib/money";

type Blocker = "banned" | "in_lobby" | "balance";

interface Copy {
  mn: ReactNode;
  en: ReactNode;
}

const entryAmount = (
  <span className="tabular-money">{formatMnt(LOBBY_ENTRY_MNT)}</span>
);

const BLOCKER_COPY: Record<Blocker, Copy> = {
  banned: {
    mn: "Таны бүртгэл хаагдсан. Лобби үзэх боломжтой.",
    en: "Account banned. You can view lobbies but not create or join.",
  },
  in_lobby: {
    mn: "Та лобби-д байна. Өөр лобби-д орохын өмнө гарна уу.",
    en: "You are in a lobby. Leave it to join another.",
  },
  balance: {
    mn: <>Хэтэвчний үлдэгдэл {entryAmount} хүрэхгүй байна.</>,
    en: (
      <>
        Your wallet does not cover{" "}
        <span className="tabular-money">
          {LOBBY_ENTRY_MNT.toLocaleString("en-US")} MNT
        </span>
        .
      </>
    ),
  },
};

const BLOCKER_TITLE: Record<Blocker, string> = {
  banned: "Account banned",
  in_lobby: "Leave your lobby first",
  balance: "Wallet does not cover 55,000 MNT",
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
  invalid_name: {
    mn: `Нэр 1-${LOBBY_NAME_MAX_LENGTH} тэмдэгт байна.`,
    en: `Name must be 1 to ${LOBBY_NAME_MAX_LENGTH} characters.`,
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

function entryBlocker(status: string, viewer: LobbyViewer): Blocker | null {
  if (status === "banned") return "banned";
  if (viewer.lobbyId) return "in_lobby";
  if (viewer.balanceMnt < LOBBY_ENTRY_MNT) return "balance";
  return null;
}

function tierBarClass(band: TierBand): string {
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

function roleCopy(role: LobbyRole): Copy {
  switch (role) {
    case "host":
      return { mn: "Та хост", en: "You host" };
    case "member":
      return { mn: "Та суусан", en: "You are seated" };
    default: {
      const unhandled: never = role;
      return unhandled;
    }
  }
}

function formatAge(createdAt: string, now: number): string {
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(createdAt).getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function TierBadge({ label, band }: { label: string; band: TierBand }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn("h-4 w-[3px] rounded-sm", tierBarClass(band))}
        aria-hidden
      />
      <span className="font-mono text-[13px] text-text">{label}</span>
    </span>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span className="font-mono text-[13px] tabular-nums text-text">
      {value}/{LOBBY_SEAT_COUNT}
    </span>
  );
}

const COLUMNS =
  "md:grid-cols-[minmax(0,1fr)_88px_88px_64px_64px_48px_104px]";

function ColumnLabel({ mn, en }: Copy) {
  return (
    <span className="flex flex-col text-[12px] leading-4 text-text-muted">
      <span>{mn}</span>
      <span className="text-[11px] text-text-faint">{en}</span>
    </span>
  );
}

export function LobbyBrowser({
  user,
  data,
  isError,
}: {
  user: AuthUser;
  data: LobbyListResponse | undefined;
  isError: boolean;
}) {
  const queryClient = useQueryClient();
  const now = useNow(30_000);
  const [name, setName] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<Copy | null>(null);

  async function run(key: string, action: () => Promise<unknown>) {
    setPendingKey(key);
    setError(null);
    try {
      await action();
    } catch (e: unknown) {
      setError(errorCopy(e instanceof Error ? e.message : ""));
    }
    await queryClient.invalidateQueries({ queryKey: LOBBIES_QUERY_KEY });
    setPendingKey(null);
  }

  if (isError) {
    return (
      <p className="text-[13px] text-danger">
        Лобби ачаалж чадсангүй. Could not load lobbies.
      </p>
    );
  }
  if (!data) {
    return <p className="text-[13px] text-text-muted">Ачаалж байна...</p>;
  }

  const { lobbies, viewer } = data;
  const blocker = entryBlocker(user.status, viewer);
  const busy = pendingKey !== null;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("create", async () => {
      await createLobby(name.trim());
      setName("");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">
            Нээлттэй лобби
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">Open lobbies</p>
        </div>

        <form onSubmit={handleCreate} className="flex w-full gap-2 sm:w-auto">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={LOBBY_NAME_MAX_LENGTH}
            placeholder="Лоббины нэр"
            aria-label="Лоббины нэр"
            disabled={blocker !== null}
            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-base px-3 text-[15px] text-text outline-none placeholder:text-text-faint focus:border-border-strong disabled:opacity-50 sm:w-64"
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={blocker !== null || busy || name.trim().length === 0}
          >
            {pendingKey === "create" ? "Үүсгэж байна..." : "Үүсгэх"}
          </Button>
        </form>
      </div>

      {blocker && (
        <div className="flex flex-col gap-0.5 border-l-[3px] border-border-strong bg-raised px-4 py-3">
          <p className="text-[15px] text-text">{BLOCKER_COPY[blocker].mn}</p>
          <p className="text-[13px] text-text-muted">
            {BLOCKER_COPY[blocker].en}
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] text-danger">{error.mn}</p>
          <p className="text-[12px] text-text-muted">{error.en}</p>
        </div>
      )}

      {lobbies.length === 0 ? (
        <div className="rounded-md border border-border bg-raised px-4 py-8 text-center">
          <p className="text-[15px] text-text">Нээлттэй лобби алга.</p>
          <p className="mt-1 text-[13px] text-text-muted">
            {blocker === null
              ? "No lobby is open. Create one above."
              : "No lobby is open."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              "hidden gap-4 px-4 pb-1 md:grid md:items-end",
              COLUMNS,
            )}
          >
            <ColumnLabel mn="Лобби" en="Lobby" />
            <ColumnLabel mn="Хост" en="Host tier" />
            <ColumnLabel mn="Дундаж" en="Average" />
            <ColumnLabel mn="Суудал" en="Seats" />
            <ColumnLabel mn="Бэлэн" en="Ready" />
            <ColumnLabel mn="Хугацаа" en="Age" />
            <span />
          </div>
          {lobbies.map((lobby) => (
            <LobbyRow
              key={lobby.id}
              lobby={lobby}
              viewer={viewer}
              blocker={blocker}
              now={now}
              busy={busy}
              pending={pendingKey === lobby.id}
              onJoin={() => run(lobby.id, () => joinLobby(lobby.id))}
              onLeave={() => run(lobby.id, () => leaveLobby(lobby.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LobbyRow({
  lobby,
  viewer,
  blocker,
  now,
  busy,
  pending,
  onJoin,
  onLeave,
}: {
  lobby: LobbySummary;
  viewer: LobbyViewer;
  blocker: Blocker | null;
  now: number;
  busy: boolean;
  pending: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const isMine = viewer.lobbyId === lobby.id;
  const isFull = lobby.occupancy >= LOBBY_SEAT_COUNT;
  const role = isMine && viewer.role ? roleCopy(viewer.role) : null;

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-md border bg-raised px-4 py-3",
        isMine ? "border-border-strong" : "border-border",
        COLUMNS,
      )}
    >
      <div className="col-span-2 min-w-0 md:col-span-1">
        <p className="truncate text-[15px] font-medium text-text">
          {lobby.name}
        </p>
        <p className="truncate text-[13px] text-text-muted">
          {lobby.hostDisplayName}
          {role && (
            <span className="text-text-faint">
              {" "}
              · {role.mn} / {role.en}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:contents">
        <TierBadge label={lobby.hostTier} band={lobby.hostTierBand} />
        <TierBadge label={lobby.averageTier} band={lobby.averageTierBand} />
        <Count value={lobby.occupancy} />
        <Count value={lobby.readyCount} />
        <span className="font-mono text-[13px] tabular-nums text-text-muted">
          {formatAge(lobby.createdAt, now)}
        </span>
      </div>

      <div className="flex justify-end">
        {isMine ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onLeave}
            disabled={busy}
          >
            {pending ? "Гарч байна..." : "Гарах"}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onJoin}
            disabled={busy || blocker !== null || isFull}
            title={blocker ? BLOCKER_TITLE[blocker] : isFull ? "Lobby full" : undefined}
          >
            {pending ? "Нэгдэж байна..." : isFull ? "Дүүрсэн" : "Нэгдэх"}
          </Button>
        )}
      </div>
    </div>
  );
}
