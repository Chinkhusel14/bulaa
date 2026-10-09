/** Captain ban/pick timer (seconds). */
export const DRAFT_PICK_SECONDS = 30;

/** Match accept window (seconds). */
export const MATCH_ACCEPT_SECONDS = 30;

/** Initial MMR match tolerance. */
export const MMR_TOLERANCE_START = 100;

/** MMR tolerance widen interval (ms). */
export const MMR_TOLERANCE_WIDEN_MS = 30_000;

/** Minimum Steam account age to play (days). */
export const AUTH_MIN_ACCOUNT_AGE_DAYS = 90;

/** Minimum CS2 hours to play. */
export const AUTH_MIN_CS2_HOURS = 100;

/** Auth error codes. */
export const AUTH_ERROR_CODES = [
  "vac_banned",
  "game_banned",
  "steam_profile_private",
  "account_too_new",
  "cs2_hours_too_low",
  "phone_in_use",
  "otp_invalid",
  "otp_expired",
  "otp_locked",
  "otp_rate_limited",
  "unauthenticated",
  "phone_required",
  "already_verified",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export const ACCOUNT_STATUSES = [
  "pending_phone",
  "active",
  "restricted",
  "banned",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const LOBBY_SEAT_COUNT = 10;

export const SIDE_SIZE = 5;

export const SIDES = ["a", "b"] as const;
export type Side = (typeof SIDES)[number];

export const MAP_POOL = [
  "ancient",
  "anubis",
  "dust2",
  "inferno",
  "mirage",
  "nuke",
  "train",
] as const;
export type MapId = (typeof MAP_POOL)[number];

export const MAP_DISPLAY_NAMES: Record<MapId, string> = {
  ancient: "Ancient",
  anubis: "Anubis",
  dust2: "Dust II",
  inferno: "Inferno",
  mirage: "Mirage",
  nuke: "Nuke",
  train: "Train",
};

export const VETO_STEPS = [
  { side: "a", action: "ban" },
  { side: "b", action: "ban" },
  { side: "a", action: "pick" },
  { side: "b", action: "pick" },
  { side: "a", action: "ban" },
  { side: "b", action: "ban" },
  { action: "decider" },
] as const;

export type VetoStep = (typeof VETO_STEPS)[number];

export const CHAT_MAX_LENGTH = 300;
export const CHAT_RATE_COUNT = 5;
export const CHAT_RATE_WINDOW_MS = 10_000;

export const VOTE_SECONDS = 30;
export const VOTE_COOLDOWN_MS = 120_000;
export const VOTE_MIN_MEMBERS = 3;

export const ACTIVE_LOBBY_STATUSES = [
  "open",
  "accepting",
  "veto",
  "awaiting_server",
] as const;
export type ActiveLobbyStatus = (typeof ACTIVE_LOBBY_STATUSES)[number];

export function lobbyRoomChannel(lobbyId: string): string {
  return `lobby:${lobbyId}`;
}

/** Host-chosen prize pool bounds for one lobby (MNT, whole match). */
export const LOBBY_PRIZE_POOL_MIN_MNT = 30_000;
export const LOBBY_PRIZE_POOL_MAX_MNT = 500_000;

/** Each player funds an equal share of the prize pool. */
export function prizeShareMnt(prizePoolMnt: number): number {
  return prizePoolMnt / LOBBY_SEAT_COUNT;
}

/** Each of the five winners takes an equal share of the prize pool. */
export function winnerPayoutMnt(prizePoolMnt: number): number {
  return prizePoolMnt / (LOBBY_SEAT_COUNT / 2);
}

/** Wallet balance a player needs to create or join a lobby. */
export function lobbyCostMnt(prizePoolMnt: number, serverFeeMnt: number): number {
  return prizeShareMnt(prizePoolMnt) + serverFeeMnt;
}

/** Redis pub/sub channel carrying the open lobby list. */
export const LOBBIES_OPEN_CHANNEL = "lobbies:open";

export const LOBBY_ERROR_CODES = [
  "unauthenticated",
  "banned",
  "phone_required",
  "insufficient_balance",
  "already_in_lobby",
  "lobby_full",
  "lobby_closed",
  "not_in_lobby",
  "invalid_prize_pool",
  "side_full",
  "same_side",
  "roster_frozen",
  "not_captain",
  "not_your_turn",
  "map_taken",
  "vote_unavailable",
  "vote_cooldown",
  "already_voting",
  "chat_rate_limited",
  "message_too_long",
  "not_accepting",
] as const;

export type LobbyErrorCode = (typeof LOBBY_ERROR_CODES)[number];
