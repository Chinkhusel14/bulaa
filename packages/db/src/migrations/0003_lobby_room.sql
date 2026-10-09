ALTER TYPE "public"."lobby_status" ADD VALUE 'accepting';--> statement-breakpoint
ALTER TYPE "public"."lobby_status" ADD VALUE 'veto';--> statement-breakpoint
CREATE TYPE "public"."lobby_side" AS ENUM('a', 'b');--> statement-breakpoint
CREATE TYPE "public"."lobby_map_action" AS ENUM('ban', 'pick', 'decider');--> statement-breakpoint
CREATE TYPE "public"."lobby_vote_status" AS ENUM('open', 'passed', 'failed');--> statement-breakpoint
ALTER TABLE "lobbies" ADD COLUMN "phase_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lobbies" ADD COLUMN "veto_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lobby_members" ADD COLUMN "side" "lobby_side";--> statement-breakpoint
ALTER TABLE "lobby_members" ADD COLUMN "slot" integer;--> statement-breakpoint
ALTER TABLE "lobby_members" ADD COLUMN "accepted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "lobby_members" SET "side" = CASE WHEN "seat" < 5 THEN 'a'::"lobby_side" ELSE 'b'::"lobby_side" END;--> statement-breakpoint
UPDATE "lobby_members" AS m
SET "slot" = s.rn - 1
FROM (
	SELECT
		"id",
		row_number() OVER (
			PARTITION BY "lobby_id", CASE WHEN "seat" < 5 THEN 'a' ELSE 'b' END
			ORDER BY "seat"
		) AS rn
	FROM "lobby_members"
) AS s
WHERE m."id" = s."id";--> statement-breakpoint
ALTER TABLE "lobby_members" ALTER COLUMN "side" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lobby_members" ALTER COLUMN "slot" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lobby_members" DROP CONSTRAINT "lobby_members_lobby_seat_unique";--> statement-breakpoint
ALTER TABLE "lobby_members" DROP COLUMN "seat";--> statement-breakpoint
ALTER TABLE "lobby_members" ADD CONSTRAINT "lobby_members_lobby_side_slot_unique" UNIQUE("lobby_id","side","slot");--> statement-breakpoint
CREATE TABLE "lobby_map_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lobby_id" uuid NOT NULL,
	"step" integer NOT NULL,
	"map" text NOT NULL,
	"action" "lobby_map_action" NOT NULL,
	"side" "lobby_side",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lobby_map_actions_lobby_step_unique" UNIQUE("lobby_id","step")
);--> statement-breakpoint
CREATE TABLE "lobby_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lobby_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "lobby_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lobby_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"started_by" uuid NOT NULL,
	"status" "lobby_vote_status" DEFAULT 'open' NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "lobby_vote_ballots" (
	"vote_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"yes" boolean NOT NULL,
	CONSTRAINT "lobby_vote_ballots_vote_user_unique" UNIQUE("vote_id","user_id")
);--> statement-breakpoint
ALTER TABLE "lobby_map_actions" ADD CONSTRAINT "lobby_map_actions_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."lobbies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_messages" ADD CONSTRAINT "lobby_messages_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."lobbies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_messages" ADD CONSTRAINT "lobby_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_votes" ADD CONSTRAINT "lobby_votes_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."lobbies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_votes" ADD CONSTRAINT "lobby_votes_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_votes" ADD CONSTRAINT "lobby_votes_started_by_users_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_vote_ballots" ADD CONSTRAINT "lobby_vote_ballots_vote_id_lobby_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."lobby_votes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_vote_ballots" ADD CONSTRAINT "lobby_vote_ballots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
