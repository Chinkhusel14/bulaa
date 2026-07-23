import {
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

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  steamId: text("steam_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  phoneE164: text("phone_e164").unique(),
  role: userRoleEnum("role").notNull().default("player"),
  mmr: integer("mmr").notNull().default(1000),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletAccounts = pgTable("wallet_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  balanceMnt: integer("balance_mnt").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
