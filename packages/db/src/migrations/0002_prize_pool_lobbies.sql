UPDATE "lobbies" SET "status" = 'cancelled' WHERE "status" = 'open';--> statement-breakpoint
ALTER TABLE "lobbies" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "lobbies" ADD COLUMN "prize_pool_mnt" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lobbies" ALTER COLUMN "prize_pool_mnt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "lobbies" ADD COLUMN "server_fee_mnt" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lobbies" ALTER COLUMN "server_fee_mnt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "lobby_members" RENAME COLUMN "seated_at" TO "joined_at";
