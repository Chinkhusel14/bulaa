/** Captain draft pick timer (seconds). */
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
] as const;

export type LobbyErrorCode = (typeof LOBBY_ERROR_CODES)[number];
