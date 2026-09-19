import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "player",
  "admin_super",
  "admin_finance",
  "admin_match",
  "admin_skill",
  "admin_support",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "pending_phone",
  "active",
  "restricted",
  "banned",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  steamId: text("steam_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  phoneE164: text("phone_e164").unique(),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  role: userRoleEnum("role").notNull().default("player"),
  status: accountStatusEnum("status").notNull().default("pending_phone"),
  mmr: integer("mmr").notNull().default(1000),
  steamCreatedAt: timestamp("steam_created_at", { withTimezone: true }),
  cs2Minutes: integer("cs2_minutes"),
  vacBanned: boolean("vac_banned").notNull().default(false),
  gameBanned: boolean("game_banned").notNull().default(false),
  lastSteamCheckAt: timestamp("last_steam_check_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const walletAccounts = pgTable("wallet_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  balanceMnt: integer("balance_mnt").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => walletAccounts.id),
  matchId: uuid("match_id"),
  amountMnt: integer("amount_mnt").notNull(),
  op: text("op").notNull(),
  requestId: text("request_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
