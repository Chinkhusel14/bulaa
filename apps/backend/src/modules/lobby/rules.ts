import type { lobbies } from "@bulaa/db";
import {
  LOBBY_ENTRY_MNT,
  LOBBY_SEAT_COUNT,
  type AccountStatus,
  type LobbyErrorCode,
  type LobbyRole,
  type TierBand,
} from "@bulaa/shared";

export type LobbyStatus = (typeof lobbies.$inferSelect)["status"];

export interface Tier {
  label: string;
  band: TierBand;
}

const TIERS: readonly (Tier & { minMmr: number })[] = [
  { minMmr: 2200, label: "Pro", band: "pro" },
  { minMmr: 2000, label: "Semi-Pro", band: "pro" },
  { minMmr: 1800, label: "1-1", band: "mid" },
  { minMmr: 1700, label: "1-2", band: "mid" },
  { minMmr: 1600, label: "1-3", band: "mid" },
  { minMmr: 1500, label: "2-1", band: "low" },
  { minMmr: 1400, label: "2-2", band: "low" },
  { minMmr: 1300, label: "2-3", band: "low" },
  { minMmr: 1200, label: "3-1", band: "low" },
  { minMmr: 1100, label: "3-2", band: "low" },
  { minMmr: 1000, label: "3-3", band: "low" },
];

const LOWEST_TIER: Tier = { label: "3-3", band: "low" };

export function tierForMmr(mmr: number): Tier {
  const match = TIERS.find((t) => mmr >= t.minMmr);
  return match ? { label: match.label, band: match.band } : LOWEST_TIER;
}

export function averageTier(
  hostMmr: number,
  seatedMmrs: readonly number[],
): Tier {
  if (seatedMmrs.length === 0) return tierForMmr(hostMmr);
  const total = seatedMmrs.reduce((sum, mmr) => sum + mmr, 0);
  return tierForMmr(total / seatedMmrs.length);
}

export function nextFreeSeat(takenSeats: readonly number[]): number | null {
  for (let seat = 0; seat < LOBBY_SEAT_COUNT; seat++) {
    if (!takenSeats.includes(seat)) return seat;
  }
  return null;
}

export interface Membership {
  lobbyId: string;
  role: LobbyRole;
}

function accountDenial(status: AccountStatus): LobbyErrorCode | null {
  switch (status) {
    case "active":
    case "restricted":
      return null;
    case "banned":
      return "banned";
    case "pending_phone":
      return "phone_required";
    default: {
      const unhandled: never = status;
      return unhandled;
    }
  }
}

export function entryDenial(caller: {
  status: AccountStatus;
  balanceMnt: number;
  membership: Membership | null;
}): LobbyErrorCode | null {
  const account = accountDenial(caller.status);
  if (account) return account;
  if (caller.membership) return "already_in_lobby";
  if (caller.balanceMnt < LOBBY_ENTRY_MNT) return "insufficient_balance";
  return null;
}

export type JoinPlan =
  | { ok: true; seat: number }
  | { ok: false; code: "lobby_closed" | "lobby_full" };

export function planJoin(
  status: LobbyStatus,
  takenSeats: readonly number[],
): JoinPlan {
  if (status !== "open") return { ok: false, code: "lobby_closed" };
  const seat = nextFreeSeat(takenSeats);
  return seat === null ? { ok: false, code: "lobby_full" } : { ok: true, seat };
}

export interface SeatedMember {
  userId: string;
  seat: number;
  seatedAt: Date;
}

export function nextHost(
  members: readonly SeatedMember[],
): SeatedMember | null {
  const [first] = [...members].sort(
    (a, b) => a.seatedAt.getTime() - b.seatedAt.getTime() || a.seat - b.seat,
  );
  return first ?? null;
}

export type LeavePlan =
  | { kind: "not_in_lobby" }
  | { kind: "free_seat" }
  | { kind: "transfer_host"; hostUserId: string }
  | { kind: "cancel" };

export function planLeave(
  hostUserId: string,
  members: readonly SeatedMember[],
  leaverId: string,
): LeavePlan {
  const isHost = hostUserId === leaverId;
  const isSeated = members.some((m) => m.userId === leaverId);
  if (!isHost && !isSeated) return { kind: "not_in_lobby" };
  if (!isHost) return { kind: "free_seat" };
  const next = nextHost(members.filter((m) => m.userId !== leaverId));
  return next
    ? { kind: "transfer_host", hostUserId: next.userId }
    : { kind: "cancel" };
}
