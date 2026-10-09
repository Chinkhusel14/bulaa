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
  totalWinnerPayoutMnt,
  winnerPayoutMnt,
} from "@bulaa/shared/constants";
import { Button, cn } from "@bulaa/ui";
import Link from "next/link";
import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
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
  flashIds,
}: {
  user: AuthUser;
  data: LobbyListResponse | undefined;
  isError: boolean;
  flashIds: ReadonlySet<string>;
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

  function resetFilters() {
    setQuery("");
    setBand(null);
    setHideFull(true);
    setSort("fill");
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-8">
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
            {lobbies.length > 0 && (
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Шүүлт цэвэрлэх / Reset filters
              </Button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-1" aria-label="Lobbies">
            {visible.map((lobby) => (
              <li key={lobby.id}>
                <ListRow
                  lobby={lobby}
                  viewer={viewer}
                  selected={lobby.id === detail?.id}
                  flashing={flashIds.has(lobby.id)}
                  onSelect={() => setSelectedId(lobby.id)}
                  now={now}
                />
              </li>
            ))}
          </ul>
        )}

        {detail && (
          <MissionCard
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
  flashing,
  onSelect,
  now,
}: {
  lobby: LobbySummary;
  viewer: LobbyViewer;
  selected: boolean;
  flashing: boolean;
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
        flashing && "animate-lobby-flash",
        selected
          ? "border-border-strong bg-[var(--primary-muted)]"
          : "hover:bg-raised border-transparent",
      )}
    >
      <span className="min-w-0">
        <span className="text-text block truncate text-[15px]">
          {lobby.hostDisplayName}
          {isMine && <span className="text-primary ml-2 text-[12px]">· Таных</span>}
        </span>
        <span className="block text-[13px]">
          <span className="text-text-faint text-[11px]">Win </span>
          <Money amount={winnerPayoutMnt(lobby.prizePoolMnt)} className="inline text-[13px]" />
        </span>
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

function MissionCard({
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
  const shortfall = after < 0 ? -after : 0;

  return (
    <aside
      aria-label="Lobby mission"
      className={cn(
        "border-border-strong bg-raised fixed inset-x-0 bottom-0 z-20 max-h-[85dvh] flex-col gap-5 overflow-y-auto border-t p-5",
        "lg:sticky lg:top-6 lg:z-auto lg:flex lg:max-h-none lg:self-start lg:rounded-md lg:border lg:p-6",
        openOnMobile ? "flex" : "hidden lg:flex",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-text-faint text-[12px]">
            {role
              ? `${role.mn} · ${role.en}`
              : `Хост · ${formatAge(lobby.createdAt, now)}`}
          </p>
          <h2 className="font-display text-text mt-1 truncate text-[24px] font-semibold leading-[30px]">
            {lobby.hostDisplayName}
          </h2>
          <div className="mt-2">
            <TierBadge label={lobby.averageTier} band={lobby.averageTierBand} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Хаах"
          className="lg:hidden"
        >
          <X weight="bold" />
        </Button>
      </div>

      <div className="border-border border-y py-4">
        <p className="text-text-muted text-[13px]">Ялагч бүрт / Each winner gets</p>
        <Money
          amount={winnerPayoutMnt(lobby.prizePoolMnt)}
          className="mt-1 block text-[24px] font-medium leading-7"
        />
        <p className="text-text-muted mt-2 text-[13px]">
          Нийт шагнал / Total to winners{" "}
          <Money amount={totalWinnerPayoutMnt(lobby.prizePoolMnt)} className="inline text-[13px]" />
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <SeatMeter occupancy={lobby.occupancy} ready={lobby.readyCount} />
          <span className="text-text-muted font-mono text-[13px] tabular-nums">
            {lobby.occupancy}/{LOBBY_SEAT_COUNT} · {lobby.readyCount} ready
          </span>
        </div>
        <SeatLegend />
      </div>

      {!isMine && (
        <dl className="bg-base border-border flex flex-col gap-2 rounded-md border p-4 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-text-muted">Таны хувь / Your share</dt>
            <dd>
              <Money amount={prizeShareMnt(lobby.prizePoolMnt)} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Сервер / Server fee</dt>
            <dd>
              <Money amount={lobby.serverFeeMnt} />
            </dd>
          </div>
          <div className="border-border flex justify-between border-t pt-2">
            <dt className="text-text font-medium">Нийт / Total on join</dt>
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
                <span className="text-danger font-medium">Хүрэлцэхгүй / Not enough</span>
              )}
            </dd>
          </div>
          {shortfall > 0 && (
            <p className="text-text-muted border-border border-t pt-2 text-[12px] leading-[18px]">
              Deposit at least{" "}
              <Money amount={shortfall} className="inline text-[12px]" /> when wallet
              opens. / Хэтэвч идэвхжихэд{" "}
              <Money amount={shortfall} className="inline text-[12px]" /> нэмнэ.
            </p>
          )}
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

