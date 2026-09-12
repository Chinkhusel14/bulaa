/** Entry fee per player (MNT). Server cost is separate. */
export const ENTRY_FEE_MNT = 10_000;

/** Server cost allocation per player (MNT). */
export const SERVER_COST_PER_PLAYER_MNT = 5_000;

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
