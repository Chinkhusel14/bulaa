import { z } from "zod";
import {
  LOBBY_PRIZE_POOL_MAX_MNT,
  LOBBY_PRIZE_POOL_MIN_MNT,
  LOBBY_SEAT_COUNT,
} from "../constants/index";

export const steamIdSchema = z.string().regex(/^7656119\d{10}$/, "Invalid SteamID64");

export const moneyMntSchema = z
  .number()
  .int()
  .nonnegative()
  .describe("Amount in MNT tögrög (integer)");

export const queuePartySizeSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const matchScoreSchema = z.object({
  teamA: z.number().int().min(0).max(16),
  teamB: z.number().int().min(0).max(16),
});

export type SteamId = z.infer<typeof steamIdSchema>;
export type MoneyMnt = z.infer<typeof moneyMntSchema>;
export type QueuePartySize = z.infer<typeof queuePartySizeSchema>;
export type MatchScore = z.infer<typeof matchScoreSchema>;

export const accountStatusSchema = z.enum([
  "pending_phone",
  "active",
  "restricted",
  "banned",
]);

export type AccountStatusEnum = z.infer<typeof accountStatusSchema>;

export const authErrorCodeSchema = z.enum([
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
]);

export const mnPhoneSchema = z
  .string()
  .regex(/^\+976\d{8}$/, "Invalid Mongolian phone number (+976 + 8 digits)");

export type MnPhone = z.infer<typeof mnPhoneSchema>;

export const phoneRequestSchema = z.object({
  phone: mnPhoneSchema,
});

export const phoneVerifySchema = z.object({
  phone: mnPhoneSchema,
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
});

export interface SteamSnapshot {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  steamCreatedAt: Date;
  cs2Minutes: number;
  vacBanned: boolean;
  gameBanned: boolean;
}

export type EligibilityResult =
  | { ok: true; snapshot: SteamSnapshot }
  | { ok: false; code: z.infer<typeof authErrorCodeSchema> };

// multipleOf keeps every player share and winner payout a whole tögrög.
export const prizePoolMntSchema = z
  .number()
  .int()
  .min(LOBBY_PRIZE_POOL_MIN_MNT)
  .max(LOBBY_PRIZE_POOL_MAX_MNT)
  .multipleOf(LOBBY_SEAT_COUNT);

export const createLobbySchema = z.object({
  prizePoolMnt: prizePoolMntSchema,
});

export type CreateLobbyInput = z.infer<typeof createLobbySchema>;

export type TierBand = "pro" | "mid" | "low";

export interface LobbySummary {
  id: string;
  prizePoolMnt: number;
  /** Fixed when the lobby is created, so later config changes never reprice it. */
  serverFeeMnt: number;
  hostDisplayName: string;
  hostTier: string;
  hostTierBand: TierBand;
  occupancy: number;
  readyCount: number;
  averageTier: string;
  averageTierBand: TierBand;
  createdAt: string;
}

export type LobbyRole = "host" | "member";

export interface LobbyViewer {
  balanceMnt: number;
  lobbyId: string | null;
  role: LobbyRole | null;
}

export interface LobbyListResponse {
  lobbies: LobbySummary[];
  viewer: LobbyViewer;
  /** Server fee a newly created lobby will charge each player. */
  serverFeeMnt: number;
}

export interface LobbySnapshotMessage {
  type: "snapshot";
  lobbies: LobbySummary[];
}
