CREATE TYPE "public"."lobby_status" AS ENUM('open', 'starting', 'awaiting_server', 'live', 'awaiting_result', 'completed', 'cancelled', 'disputed');--> statement-breakpoint
CREATE TABLE "lobbies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"host_user_id" uuid NOT NULL,
	"status" "lobby_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lobby_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lobby_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"seat" integer NOT NULL,
	"ready" boolean DEFAULT false NOT NULL,
	"seated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lobby_members_lobby_user_unique" UNIQUE("lobby_id","user_id"),
	CONSTRAINT "lobby_members_lobby_seat_unique" UNIQUE("lobby_id","seat")
);
--> statement-breakpoint
ALTER TABLE "lobbies" ADD CONSTRAINT "lobbies_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_members" ADD CONSTRAINT "lobby_members_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."lobbies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_members" ADD CONSTRAINT "lobby_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;