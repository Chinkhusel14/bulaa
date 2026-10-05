"use client";

import type {
  LobbyListResponse,
  LobbySummary,
  LobbyViewer,
  TierBand,
} from "@bulaa/shared";
import {
  LOBBY_SEAT_COUNT,
  prizeShareMnt,
  winnerPayoutMnt,
} from "@bulaa/shared/constants";
import { Button, cn } from "@bulaa/ui";
import Link from "next/link";
import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react/dist/ssr";
import { useState, type ReactNode } from "react";
import type { AuthUser } from "@/lib/api";
import { CreateLobbyWizard } from "./create-lobby-wizard";
import {
  ActionError,
  BlockerNotice,
  LobbiesLoadError,
  LobbiesLoading,
  Money,
  SeatAction,
  SeatLegend,
  SeatMeter,
  TIER_BANDS,
  TierBadge,
  accountBlocker,
  bandLabel,
  byClosestToStart,
  formatAge,
  isFull,
  joinCostMnt,
  roleCopy,
  seatClass,
  tierBarClass,
  useLobbyActions,
  useNow,
  type Blocker,
  type LobbyActions,
} from "./lobby-kit";

type SortKey = "fill" | "prize" | "newest" | "tier";

const SORT_LABEL: Record<SortKey, string> = {
  fill: "Дүүрэлт / Fill",
  prize: "Шагнал / Prize",
  newest: "Шинэ / Newest",
  tier: "Түвшин / Tier",
};

const BAND_RANK: Record<TierBand, number> = { pro: 0, mid: 1, low: 2 };

function sortLobbies(lobbies: LobbySummary[], key: SortKey): LobbySummary[] {
  const sorted = [...lobbies];
  switch (key) {
    case "fill":
      return sorted.sort(byClosestToStart);
    case "prize":
      return sorted.sort(
        (a, b) => b.prizePoolMnt - a.prizePoolMnt || byClosestToStart(a, b),
      );
    case "newest":
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "tier":
      // Labels sort strongest-first within a band: Pro < Semi-Pro, 1-1 < 1-3.
      return sorted.sort(
        (a, b) =>
          BAND_RANK[a.averageTierBand] - BAND_RANK[b.averageTierBand] ||
          a.averageTier.localeCompare(b.averageTier),
      );
    default: {
      const unhandled: never = key;
      return unhandled;
    }
  }
}

/** Filterable lobby list with a detail pane for the selected lobby. */
export function LobbyScout({
  user,
  data,
  isError,
}: {
  user: AuthUser;
  data: LobbyListResponse | undefined;
  isError: boolean;
}) {
  const actions = useLobbyActions();
  const now = useNow(30_000);
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<TierBand | null>(null);
  const [hideFull, setHideFull] = useState(true);
  const [sort, setSort] = useState<SortKey>("fill");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (isError) return <LobbiesLoadError />;
  if (!data) return <LobbiesLoading />;

  const { lobbies, viewer, serverFeeMnt } = data;
  const account = accountBlocker(user.status, viewer);
  const needle = query.trim().toLowerCase();
  const visible = sortLobbies(
    lobbies.filter(
      (l) =>
        (band === null || l.averageTierBand === band) &&
        (!hideFull || !isFull(l) || l.id === viewer.lobbyId) &&
        (needle === "" || l.hostDisplayName.toLowerCase().includes(needle)),
    ),
    sort,
  );
  const picked = lobbies.find((l) => l.id === selectedId) ?? null;
  const detail =
    picked ?? lobbies.find((l) => l.id === viewer.lobbyId) ?? visible[0] ?? null;

  function toggleWizard(open: boolean) {
    actions.clearError();
    setCreating(open);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-text text-2xl font-semibold">Лобби сонгох</h1>
          <p className="text-text-muted mt-1 text-[13px]">
            Open lobbies{" "}
            <span className="text-text-faint font-mono tabular-nums">
              {visible.length}/{lobbies.length}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {viewer.lobbyId && (
            <Button variant="secondary" asChild>
              <Link href={`/play/${viewer.lobbyId}`}>Лобби руу / Open room</Link>
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => toggleWizard(true)}
            disabled={account !== null}
          >
            <Plus weight="bold" />
            Лобби үүсгэх
          </Button>
        </div>
      </div>

      {account && <BlockerNotice blocker={account} />}
      {!creating && actions.error && <ActionError error={actions.error} />}

      <div className="border-border flex flex-col gap-3 border-y py-3 lg:flex-row lg:items-center">
        <label className="border-border bg-base focus-within:border-border-strong flex h-9 items-center gap-2 rounded-md border px-3 lg:flex-1">
          <MagnifyingGlass className="text-text-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Хост хайх / Search host"
            aria-label="Search by host"
            className="text-text placeholder:text-text-faint min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Average tier" className="flex gap-1">
            <FilterChip
              active={band === null}
              onClick={() => setBand(null)}
              label="All"
            />
            {TIER_BANDS.map((b) => (
              <FilterChip
                key={b}
                active={band === b}
                onClick={() => setBand(b)}
                label={bandLabel(b)}
                barClass={tierBarClass(b)}
              />
            ))}
          </div>
          <label className="text-text-muted flex h-8 items-center gap-2 px-1 text-[13px]">
            <input
              type="checkbox"
              checked={hideFull}
              onChange={(e) => setHideFull(e.target.checked)}
              className="size-3.5 accent-[var(--primary)]"
            />
            Дүүрснийг нуух
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort"
            className="border-border bg-base text-text focus:border-border-strong h-8 rounded-sm border px-2 text-[13px] outline-none"
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABEL[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-start gap-2 py-8">
            <p className="text-text text-[15px]">
              {lobbies.length === 0
                ? "Нээлттэй лобби алга."
                : "Шүүлтэд тохирох лобби алга."}
            </p>
            <p className="text-text-muted text-[13px]">
              {lobbies.length === 0
                ? "No lobby is open. Create one above."
                : "No lobby matches these filters."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1" aria-label="Lobbies">
            {visible.map((lobby) => (
              <li key={lobby.id}>
                <ListRow
                  lobby={lobby}
                  viewer={viewer}
                  selected={lobby.id === detail?.id}
                  onSelect={() => setSelectedId(lobby.id)}
                  now={now}
                />
              </li>
            ))}
          </ul>
        )}

        {detail && (
          <DetailPane
            lobby={detail}
            viewer={viewer}
            account={account}
            actions={actions}
            now={now}
            openOnMobile={picked !== null}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {creating && (
        <CreateLobbyWizard
          serverFeeMnt={serverFeeMnt}
          balanceMnt={viewer.balanceMnt}
          actions={actions}
          onClose={() => toggleWizard(false)}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  barClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  barClass?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-2 rounded-sm border px-3 text-[13px] transition-colors",
        active
          ? "border-border-strong bg-overlay text-text"
          : "border-border text-text-muted hover:bg-overlay",
      )}
    >
      {barClass && (
        <span className={cn("h-3 w-[3px] rounded-sm", barClass)} aria-hidden />
      )}
      {label}
    </button>
  );
}

function ListRow({
  lobby,
  viewer,
  selected,
  onSelect,
  now,
}: {
  lobby: LobbySummary;
  viewer: LobbyViewer;
  selected: boolean;
  onSelect: () => void;
  now: number;
}) {
  const isMine = viewer.lobbyId === lobby.id;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-md border px-3 py-2.5 text-left transition-colors",
        "sm:grid-cols-[minmax(0,1fr)_88px_88px_40px]",
        selected
          ? "border-border-strong bg-overlay"
          : "hover:bg-raised border-transparent",
      )}
    >
      <span className="min-w-0">
        <span className="text-text block truncate text-[15px]">
          {lobby.hostDisplayName}
          {isMine && <span className="text-primary ml-2 text-[12px]">· Таных</span>}
        </span>
        <Money amount={lobby.prizePoolMnt} className="block text-[13px]" />
      </span>
      <TierBadge label={lobby.averageTier} band={lobby.averageTierBand} />
      <span className="col-span-2 flex items-center gap-2 sm:col-span-1">
        <SeatMeter occupancy={lobby.occupancy} ready={lobby.readyCount} />
        <span className="text-text-muted font-mono text-[12px] tabular-nums sm:hidden">
          {lobby.occupancy}/{LOBBY_SEAT_COUNT}
        </span>
      </span>
      <span className="text-text-faint hidden text-right font-mono text-[12px] tabular-nums sm:block">
        {formatAge(lobby.createdAt, now)}
      </span>
    </button>
  );
}

function DetailPane({
  lobby,
  viewer,
  account,
  actions,
  now,
  openOnMobile,
  onClose,
}: {
  lobby: LobbySummary;
  viewer: LobbyViewer;
  account: Blocker | null;
  actions: LobbyActions;
  now: number;
  openOnMobile: boolean;
  onClose: () => void;
}) {
  const isMine = viewer.lobbyId === lobby.id;
  const role = isMine && viewer.role ? roleCopy(viewer.role) : null;
  const cost = joinCostMnt(lobby);
  const after = viewer.balanceMnt - cost;

  return (
    <aside
      aria-label="Lobby detail"
      className={cn(
        "border-border-strong bg-raised fixed inset-x-0 bottom-0 z-20 max-h-[80dvh] flex-col gap-5 overflow-y-auto border-t p-5",
        "md:sticky md:top-6 md:z-auto md:flex md:max-h-none md:self-start md:rounded-md md:border",
        openOnMobile ? "flex" : "hidden",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-text-faint text-[12px]">
            {role
              ? `${role.mn} · ${role.en}`
              : `Хост · ${formatAge(lobby.createdAt, now)}`}
          </p>
          <h2 className="font-display text-text flex items-center gap-2 text-[24px] font-semibold leading-[30px]">
            <span className="truncate">{lobby.hostDisplayName}</span>
          </h2>
          <div className="mt-1">
            <TierBadge label={lobby.hostTier} band={lobby.hostTierBand} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Хаах"
          className="md:hidden"
        >
          <X weight="bold" />
        </Button>
      </div>

      <dl className="flex flex-col gap-1.5 text-[13px]">
        <div className="flex flex-col gap-0.5">
          <dt className="text-text-muted">Шагналын сан / Prize pool</dt>
          <dd>
            <Money
              amount={lobby.prizePoolMnt}
              className="text-[20px] font-medium leading-6"
            />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Ялагч бүрт / Each winner</dt>
          <dd>
            <Money amount={winnerPayoutMnt(lobby.prizePoolMnt)} />
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <ol className="grid grid-cols-5 gap-1" aria-label="Seats">
          {Array.from({ length: LOBBY_SEAT_COUNT }, (_, i) => (
            <li
              key={i}
              className={cn(
                "flex h-9 items-center justify-center rounded-sm font-mono text-[12px] tabular-nums",
                seatClass(i, lobby.occupancy, lobby.readyCount),
                i < lobby.occupancy ? "text-primary-foreground" : "text-text-faint",
              )}
            >
              {i + 1}
            </li>
          ))}
        </ol>
        <SeatLegend />
      </div>

      <dl className="border-border grid grid-cols-3 gap-3 border-y py-3">
        <Stat label="Дундаж / Avg">
          <TierBadge label={lobby.averageTier} band={lobby.averageTierBand} />
        </Stat>
        <Stat label="Тоглогч / Players">
          <span className="text-text font-mono text-[13px] tabular-nums">
            {lobby.occupancy}/{LOBBY_SEAT_COUNT}
          </span>
        </Stat>
        <Stat label="Бэлэн / Ready">
          <span className="text-text font-mono text-[13px] tabular-nums">
            {lobby.readyCount}/{LOBBY_SEAT_COUNT}
          </span>
        </Stat>
      </dl>

      {!isMine && (
        <dl className="flex flex-col gap-1.5 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-text-muted">Таны хувь / Your share</dt>
            <dd>
              <Money amount={prizeShareMnt(lobby.prizePoolMnt)} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Серверийн төлбөр / Server fee</dt>
            <dd>
              <Money amount={lobby.serverFeeMnt} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text">Нийт / Total, locked on join</dt>
            <dd>
              <Money amount={cost} className="font-medium" />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Үлдэгдэл / After join</dt>
            <dd>
              {after >= 0 ? (
                <Money amount={after} />
              ) : (
                <span className="text-danger">Хүрэлцэхгүй / Not enough</span>
              )}
            </dd>
          </div>
        </dl>
      )}

      <SeatAction
        lobby={lobby}
        viewer={viewer}
        account={account}
        actions={actions}
        className="w-full"
      />
    </aside>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-text-faint text-[11px]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
