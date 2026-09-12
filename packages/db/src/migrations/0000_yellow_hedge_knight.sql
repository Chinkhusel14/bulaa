CREATE TYPE "public"."account_status" AS ENUM('pending_phone', 'active', 'restricted', 'banned');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('player', 'admin_super', 'admin_finance', 'admin_match', 'admin_skill', 'admin_support');--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"match_id" uuid,
	"amount_mnt" integer NOT NULL,
	"op" text NOT NULL,
	"request_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"steam_id" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"phone_e164" text,
	"phone_verified_at" timestamp with time zone,
	"role" "user_role" DEFAULT 'player' NOT NULL,
	"status" "account_status" DEFAULT 'pending_phone' NOT NULL,
	"mmr" integer DEFAULT 1000 NOT NULL,
	"steam_created_at" timestamp with time zone,
	"cs2_minutes" integer,
	"vac_banned" boolean DEFAULT false NOT NULL,
	"game_banned" boolean DEFAULT false NOT NULL,
	"last_steam_check_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_steam_id_unique" UNIQUE("steam_id"),
	CONSTRAINT "users_phone_e164_unique" UNIQUE("phone_e164")
);
--> statement-breakpoint
CREATE TABLE "wallet_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance_mnt" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_accounts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_wallet_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;