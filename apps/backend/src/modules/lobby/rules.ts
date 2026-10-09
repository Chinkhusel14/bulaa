import type { lobbies } from "@bulaa/db";
import {
  LOBBY_SEAT_COUNT,
  MAP_POOL,
  SIDE_SIZE,
  SIDES,
  VETO_STEPS,
  type AccountStatus,
  type LobbyErrorCode,
  type LobbyRole,
  type MapId,
  type Side,
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

export function averageTier(hostMmr: number, memberMmrs: readonly number[]): Tier {
  if (memberMmrs.length === 0) return tierForMmr(hostMmr);
  const total = memberMmrs.reduce((sum, mmr) => sum + mmr, 0);
  return tierForMmr(total / memberMmrs.length);
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
  costMnt: number;
  membership: Membership | null;
}): LobbyErrorCode | null {
  const account = accountDenial(caller.status);
  if (account) return account;
  if (caller.membership) return "already_in_lobby";
  if (caller.balanceMnt < caller.costMnt) return "insufficient_balance";
  return null;
}

export interface LobbyMember {
  userId: string;
  side: Side;
  slot: number;
  joinedAt: Date;
  ready: boolean;
  accepted: boolean;
}

export type Placement =
  | { ok: true; side: Side; slot: number }
  | { ok: false; code: "lobby_full" };

function sideCount(members: readonly LobbyMember[], side: Side): number {
  return members.filter((m) => m.side === side).length;
}

export function packMembers(members: readonly LobbyMember[]): LobbyMember[] {
  const packed: LobbyMember[] = [];
  for (const side of SIDES) {
    members
      .filter((m) => m.side === side)
      .sort((a, b) => a.slot - b.slot || a.userId.localeCompare(b.userId))
      .forEach((m, slot) => packed.push({ ...m, slot }));
  }
  return packed;
}

export function planPlacement(members: readonly LobbyMember[]): Placement {
  if (members.length >= LOBBY_SEAT_COUNT) return { ok: false, code: "lobby_full" };
  const a = sideCount(members, "a");
  const b = sideCount(members, "b");
  if (a <= b) {
    return a >= SIDE_SIZE ? { ok: false, code: "lobby_full" } : { ok: true, side: "a", slot: a };
  }
  return b >= SIDE_SIZE ? { ok: false, code: "lobby_full" } : { ok: true, side: "b", slot: b };
}

export type JoinPlan =
  | { ok: true; side: Side; slot: number }
  | { ok: false; code: "lobby_closed" | "lobby_full" };

export function planJoin(status: LobbyStatus, members: readonly LobbyMember[]): JoinPlan {
  if (status !== "open") return { ok: false, code: "lobby_closed" };
  const placement = planPlacement(members);
  return placement.ok ? placement : { ok: false, code: placement.code };
}

export type MovePlan =
  | { ok: true; members: LobbyMember[] }
  | { ok: false; code: "side_full" | "same_side" | "not_in_lobby" };

export function planMove(
  members: readonly LobbyMember[],
  userId: string,
  targetSide: Side,
): MovePlan {
  const actor = members.find((m) => m.userId === userId);
  if (!actor) return { ok: false, code: "not_in_lobby" };
  if (actor.side === targetSide) return { ok: false, code: "same_side" };
  if (sideCount(members, targetSide) >= SIDE_SIZE) return { ok: false, code: "side_full" };
  const moved: LobbyMember = {
    ...actor,
    side: targetSide,
    slot: sideCount(members, targetSide),
  };
  return {
    ok: true,
    members: packMembers(members.map((m) => (m.userId === userId ? moved : m))),
  };
}

function byJoinOrder(a: LobbyMember, b: LobbyMember): number {
  return (
    a.joinedAt.getTime() - b.joinedAt.getTime() || a.slot - b.slot || a.userId.localeCompare(b.userId)
  );
}

export function nextHost(members: readonly LobbyMember[]): LobbyMember | null {
  const [first] = [...members].sort(byJoinOrder);
  return first ?? null;
}

export type Captains = { a: string | null; b: string | null };

export function captains(members: readonly LobbyMember[]): Captains {
  const result: Captains = { a: null, b: null };
  for (const side of SIDES) {
    const [first] = members.filter((m) => m.side === side).sort(byJoinOrder);
    result[side] = first?.userId ?? null;
  }
  return result;
}

export type LeavePlan =
  | { kind: "not_in_lobby" }
  | { kind: "free_seat" }
  | { kind: "transfer_host"; hostUserId: string }
  | { kind: "cancel" };

export function planLeave(
  hostUserId: string,
  members: readonly LobbyMember[],
  leaverId: string,
): LeavePlan {
  const isHost = hostUserId === leaverId;
  const isMember = members.some((m) => m.userId === leaverId);
  if (!isHost && !isMember) return { kind: "not_in_lobby" };
  if (!isHost) return { kind: "free_seat" };
  const next = nextHost(members.filter((m) => m.userId !== leaverId));
  return next ? { kind: "transfer_host", hostUserId: next.userId } : { kind: "cancel" };
}

export function voteThreshold(memberCount: number): number {
  return Math.ceil((memberCount - 1) / 2) + 1;
}

/** A passed vote blocks rejoining that lobby until `until`. */
export function rejoinBlockActive(until: Date | null, nowMs: number): boolean {
  return until !== null && until.getTime() > nowMs;
}

export function canOpenAccept(members: readonly LobbyMember[]): boolean {
  return (
    members.length === LOBBY_SEAT_COUNT &&
    sideCount(members, "a") === SIDE_SIZE &&
    sideCount(members, "b") === SIDE_SIZE &&
    members.every((m) => m.ready)
  );
}

export type AcceptEvent =
  | { kind: "all_ready" }
  | { kind: "accepted"; userId: string }
  | { kind: "declined"; userId: string }
  | { kind: "timeout" }
  | { kind: "roster_changed" };

export type PhaseDeadlineKind = "accept" | "veto";
export type PhaseDeadlineUpdate = PhaseDeadlineKind | null | "keep";

export type AcceptPlan =
  | { ok: false; code: LobbyErrorCode }
  | {
      ok: true;
      status: "open" | "accepting" | "veto";
      members: LobbyMember[];
      phaseDeadline: PhaseDeadlineUpdate;
      vetoStep: number;
    };

function clearAccepted(members: readonly LobbyMember[]): LobbyMember[] {
  return members.map((m) => ({ ...m, accepted: false }));
}

export function planAccept(
  status: LobbyStatus,
  members: readonly LobbyMember[],
  event: AcceptEvent,
): AcceptPlan {
  switch (event.kind) {
    case "all_ready": {
      if (status !== "open") return { ok: false, code: "lobby_closed" };
      if (!canOpenAccept(members)) return { ok: false, code: "lobby_closed" };
      return {
        ok: true,
        status: "accepting",
        members: clearAccepted(members),
        phaseDeadline: "accept",
        vetoStep: 0,
      };
    }
    case "accepted": {
      if (status !== "accepting") return { ok: false, code: "not_accepting" };
      if (!members.some((m) => m.userId === event.userId)) {
        return { ok: false, code: "not_in_lobby" };
      }
      const next = members.map((m) =>
        m.userId === event.userId ? { ...m, accepted: true } : m,
      );
      const allIn = next.length === LOBBY_SEAT_COUNT && next.every((m) => m.accepted);
      return {
        ok: true,
        status: allIn ? "veto" : "accepting",
        members: next,
        phaseDeadline: allIn ? "veto" : "keep",
        vetoStep: 0,
      };
    }
    case "declined": {
      if (status !== "accepting") return { ok: false, code: "not_accepting" };
      if (!members.some((m) => m.userId === event.userId)) {
        return { ok: false, code: "not_in_lobby" };
      }
      return {
        ok: true,
        status: "open",
        members: members.map((m) => ({
          ...m,
          ready: m.userId === event.userId || !m.accepted ? false : m.ready,
          accepted: false,
        })),
        phaseDeadline: null,
        vetoStep: 0,
      };
    }
    case "timeout": {
      if (status !== "accepting") return { ok: false, code: "not_accepting" };
      return {
        ok: true,
        status: "open",
        members: members.map((m) => ({
          ...m,
          ready: m.accepted ? m.ready : false,
          accepted: false,
        })),
        phaseDeadline: null,
        vetoStep: 0,
      };
    }
    case "roster_changed": {
      return {
        ok: true,
        status: "open",
        members: clearAccepted(members),
        phaseDeadline: null,
        vetoStep: 0,
      };
    }
    default: {
      const unhandled: never = event;
      throw new Error(`Unhandled accept event ${JSON.stringify(unhandled)}`);
    }
  }
}

export type MapActionKind = "ban" | "pick" | "decider";

export interface MapAction {
  step: number;
  map: MapId;
  action: MapActionKind;
  side: Side | null;
}

export type VetoInput = { kind: "pick"; map: MapId; actorSide: Side } | { kind: "timeout" };

export type VetoPlan =
  | { ok: false; code: LobbyErrorCode }
  | {
      ok: true;
      actions: MapAction[];
      vetoStep: number;
      status: "veto" | "awaiting_server";
      phaseDeadline: PhaseDeadlineKind | null;
    };

function remainingMaps(usedMapIds: readonly string[]): MapId[] {
  return MAP_POOL.filter((id) => !usedMapIds.includes(id));
}

function isMapId(value: string): value is MapId {
  return (MAP_POOL as readonly string[]).includes(value);
}

function applyDecider(usedMapIds: readonly string[], step: number): MapAction | null {
  const leftover = remainingMaps(usedMapIds);
  const map = leftover[0];
  if (!map || leftover.length !== 1) return null;
  return { step, map, action: "decider", side: null };
}

export function planVeto(
  step: number,
  usedMapIds: readonly string[],
  input: VetoInput,
  rng: () => number,
): VetoPlan {
  const current = VETO_STEPS[step];
  if (!current) return { ok: false, code: "lobby_closed" };
  if (!("side" in current)) return { ok: false, code: "lobby_closed" };

  let map: MapId;
  switch (input.kind) {
    case "pick": {
      if (input.actorSide !== current.side) return { ok: false, code: "not_your_turn" };
      if (!isMapId(input.map) || usedMapIds.includes(input.map)) {
        return { ok: false, code: "map_taken" };
      }
      map = input.map;
      break;
    }
    case "timeout": {
      const leftover = remainingMaps(usedMapIds);
      const chosen = leftover[Math.floor(rng() * leftover.length)];
      if (!chosen) return { ok: false, code: "map_taken" };
      map = chosen;
      break;
    }
    default: {
      const unhandled: never = input;
      return unhandled;
    }
  }

  const action: MapAction = {
    step,
    map,
    action: current.action,
    side: current.side,
  };
  const used = [...usedMapIds, map];
  const nextStep = step + 1;
  const next = VETO_STEPS[nextStep];
  if (next && !("side" in next)) {
    const decider = applyDecider(used, nextStep);
    if (!decider) return { ok: false, code: "map_taken" };
    return {
      ok: true,
      actions: [action, decider],
      vetoStep: nextStep,
      status: "awaiting_server",
      phaseDeadline: null,
    };
  }
  return {
    ok: true,
    actions: [action],
    vetoStep: nextStep,
    status: "veto",
    phaseDeadline: "veto",
  };
}
