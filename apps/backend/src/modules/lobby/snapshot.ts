import {
  lobbies,
  lobbyMapActions,
  lobbyMembers,
  lobbyMessages,
  lobbyVoteBallots,
  lobbyVotes,
  users,
  type Database,
} from "@bulaa/db";
import {
  LOBBIES_OPEN_CHANNEL,
  MAP_POOL,
  lobbyRoomChannel,
  type LobbyRoom,
  type LobbyRoomMapAction,
  type LobbyRoomMessage,
  type LobbySnapshotMessage,
  type LobbySummary,
  type MapId,
} from "@bulaa/shared";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { assertRoomMember, lobbyError } from "./commands";
import { captains, voteThreshold, tierForMmr, averageTier } from "./rules";

export async function loadOpenLobbies(db: Database): Promise<LobbySummary[]> {
  const rows = await db
    .select({
      id: lobbies.id,
      prizePoolMnt: lobbies.prizePoolMnt,
      serverFeeMnt: lobbies.serverFeeMnt,
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
    const joined = members.filter((m) => m.lobbyId === row.id);
    const host = tierForMmr(row.hostMmr);
    const average = averageTier(
      row.hostMmr,
      joined.map((m) => m.mmr),
    );
    return {
      id: row.id,
      prizePoolMnt: row.prizePoolMnt,
      serverFeeMnt: row.serverFeeMnt,
      hostDisplayName: row.hostDisplayName,
      hostTier: host.label,
      hostTierBand: host.band,
      occupancy: joined.length,
      readyCount: joined.filter((m) => m.ready).length,
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

function asMapId(map: string): MapId | null {
  return (MAP_POOL as readonly string[]).includes(map) ? (map as MapId) : null;
}

export interface RoomCore {
  room: Omit<LobbyRoom, "viewerUserId" | "vote"> & {
    vote: (NonNullable<LobbyRoom["vote"]> & { ballots: { userId: string; yes: boolean }[] }) | null;
  };
}

export function personalizeRoom(core: RoomCore, viewerUserId: string): LobbyRoom {
  const vote = core.room.vote;
  return {
    ...core.room,
    viewerUserId,
    vote: vote
      ? {
          id: vote.id,
          targetUserId: vote.targetUserId,
          yesCount: vote.yesCount,
          noCount: vote.noCount,
          threshold: vote.threshold,
          endsAt: vote.endsAt,
          myBallot: vote.ballots.find((b) => b.userId === viewerUserId)?.yes ?? null,
        }
      : null,
  };
}

export function roomMessage(room: LobbyRoom): string {
  const message: LobbyRoomMessage = { type: "room", room };
  return JSON.stringify(message);
}

export async function loadRoomCore(db: Database, lobbyId: string): Promise<RoomCore> {
  const [lobby] = await db.select().from(lobbies).where(eq(lobbies.id, lobbyId)).limit(1);
  if (!lobby) throw lobbyError("lobby_closed");

  const playerRows = await db
    .select({
      userId: lobbyMembers.userId,
      steamId: users.steamId,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      mmr: users.mmr,
      side: lobbyMembers.side,
      slot: lobbyMembers.slot,
      ready: lobbyMembers.ready,
      accepted: lobbyMembers.accepted,
      joinedAt: lobbyMembers.joinedAt,
    })
    .from(lobbyMembers)
    .innerJoin(users, eq(users.id, lobbyMembers.userId))
    .where(eq(lobbyMembers.lobbyId, lobbyId));

  const members = playerRows.map((row) => ({
    userId: row.userId,
    side: row.side,
    slot: row.slot,
    joinedAt: row.joinedAt,
    ready: row.ready,
    accepted: row.accepted,
  }));
  const caps = captains(members);

  const [messageRows, actionRows, [openVote]] = await Promise.all([
    db
      .select({
        id: lobbyMessages.id,
        userId: lobbyMessages.userId,
        displayName: users.displayName,
        body: lobbyMessages.body,
        createdAt: lobbyMessages.createdAt,
      })
      .from(lobbyMessages)
      .innerJoin(users, eq(users.id, lobbyMessages.userId))
      .where(eq(lobbyMessages.lobbyId, lobbyId))
      .orderBy(asc(lobbyMessages.createdAt)),
    db
      .select()
      .from(lobbyMapActions)
      .where(eq(lobbyMapActions.lobbyId, lobbyId))
      .orderBy(asc(lobbyMapActions.step)),
    db
      .select()
      .from(lobbyVotes)
      .where(and(eq(lobbyVotes.lobbyId, lobbyId), eq(lobbyVotes.status, "open")))
      .limit(1),
  ]);

  let vote: RoomCore["room"]["vote"] = null;
  if (openVote && openVote.endsAt.getTime() > Date.now()) {
    const ballots = await db
      .select({ userId: lobbyVoteBallots.userId, yes: lobbyVoteBallots.yes })
      .from(lobbyVoteBallots)
      .where(eq(lobbyVoteBallots.voteId, openVote.id));
    vote = {
      id: openVote.id,
      targetUserId: openVote.targetUserId,
      yesCount: ballots.filter((b) => b.yes).length,
      noCount: ballots.filter((b) => !b.yes).length,
      threshold: voteThreshold(playerRows.length),
      endsAt: openVote.endsAt.toISOString(),
      myBallot: null,
      ballots,
    };
  }

  const mapActions: LobbyRoomMapAction[] = [];
  for (const row of actionRows) {
    const map = asMapId(row.map);
    if (!map) continue;
    mapActions.push({ step: row.step, map, action: row.action, side: row.side });
  }

  return {
    room: {
      id: lobby.id,
      status: lobby.status,
      prizePoolMnt: lobby.prizePoolMnt,
      serverFeeMnt: lobby.serverFeeMnt,
      phaseDeadline: lobby.phaseDeadline?.toISOString() ?? null,
      vetoStep: lobby.vetoStep,
      players: playerRows
        .slice()
        .sort((a, b) => a.side.localeCompare(b.side) || a.slot - b.slot)
        .map((row) => {
          const tier = tierForMmr(row.mmr);
          return {
            userId: row.userId,
            steamId: row.steamId,
            displayName: row.displayName,
            avatarUrl: row.avatarUrl,
            tier: tier.label,
            tierBand: tier.band,
            side: row.side,
            slot: row.slot,
            ready: row.ready,
            accepted: row.accepted,
            host: lobby.hostUserId === row.userId,
            captain: caps[row.side] === row.userId,
            joinedAt: row.joinedAt.toISOString(),
          };
        }),
      messages: messageRows.map((row) => ({
        id: row.id,
        userId: row.userId,
        displayName: row.displayName,
        body: row.body,
        createdAt: row.createdAt.toISOString(),
      })),
      vote,
      mapActions,
    },
  };
}

export async function loadRoom(
  db: Database,
  lobbyId: string,
  viewerUserId: string,
): Promise<LobbyRoom> {
  await assertRoomMember(db, lobbyId, viewerUserId);
  return personalizeRoom(await loadRoomCore(db, lobbyId), viewerUserId);
}

export async function publishRoom(app: FastifyInstance, lobbyId: string): Promise<void> {
  try {
    const core = await loadRoomCore(app.db, lobbyId);
    await app.redis.publish(lobbyRoomChannel(lobbyId), JSON.stringify(core));
  } catch (err) {
    app.log.warn({ err, lobbyId }, "lobby room publish failed");
  }
}
