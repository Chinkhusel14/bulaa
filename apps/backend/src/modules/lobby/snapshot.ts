import { lobbies, lobbyMembers, users, type Database } from "@bulaa/db";
import {
  LOBBIES_OPEN_CHANNEL,
  type LobbySnapshotMessage,
  type LobbySummary,
} from "@bulaa/shared";
import { desc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { averageTier, tierForMmr } from "./rules";

export async function loadOpenLobbies(db: Database): Promise<LobbySummary[]> {
  const rows = await db
    .select({
      id: lobbies.id,
      name: lobbies.name,
      createdAt: lobbies.createdAt,
      hostDisplayName: users.displayName,
      hostMmr: users.mmr,
    })
    .from(lobbies)
    .innerJoin(users, eq(users.id, lobbies.hostUserId))
    .where(eq(lobbies.status, "open"))
    .orderBy(desc(lobbies.createdAt));
  if (rows.length === 0) return [];

  const members = await db
    .select({
      lobbyId: lobbyMembers.lobbyId,
      ready: lobbyMembers.ready,
      mmr: users.mmr,
    })
    .from(lobbyMembers)
    .innerJoin(users, eq(users.id, lobbyMembers.userId))
    .where(
      inArray(
        lobbyMembers.lobbyId,
        rows.map((row) => row.id),
      ),
    );

  return rows.map((row) => {
    const seated = members.filter((m) => m.lobbyId === row.id);
    const host = tierForMmr(row.hostMmr);
    const average = averageTier(
      row.hostMmr,
      seated.map((m) => m.mmr),
    );
    return {
      id: row.id,
      name: row.name,
      hostDisplayName: row.hostDisplayName,
      hostTier: host.label,
      hostTierBand: host.band,
      occupancy: seated.length,
      readyCount: seated.filter((m) => m.ready).length,
      averageTier: average.label,
      averageTierBand: average.band,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export async function snapshotMessage(db: Database): Promise<string> {
  const message: LobbySnapshotMessage = {
    type: "snapshot",
    lobbies: await loadOpenLobbies(db),
  };
  return JSON.stringify(message);
}

export async function publishOpenLobbies(app: FastifyInstance): Promise<void> {
  try {
    await app.redis.publish(LOBBIES_OPEN_CHANNEL, await snapshotMessage(app.db));
  } catch (err) {
    app.log.warn({ err }, "lobby snapshot publish failed");
  }
}
