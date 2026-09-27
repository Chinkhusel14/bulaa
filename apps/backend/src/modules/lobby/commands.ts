import {
  lobbies,
  lobbyMembers,
  users,
  walletAccounts,
  type Database,
} from "@bulaa/db";
import type { LobbyErrorCode, LobbyViewer } from "@bulaa/shared";
import { and, eq } from "drizzle-orm";
import { AppError } from "../../lib/errors";
import {
  entryDenial,
  planJoin,
  planLeave,
  type Membership,
} from "./rules";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Queryable = Pick<Database, "select">;

const ERROR_STATUS: Record<LobbyErrorCode, number> = {
  unauthenticated: 401,
  banned: 403,
  phone_required: 403,
  insufficient_balance: 402,
  already_in_lobby: 409,
  lobby_full: 409,
  lobby_closed: 409,
  not_in_lobby: 409,
  invalid_name: 400,
};

export function lobbyError(code: LobbyErrorCode): AppError {
  return new AppError(code, ERROR_STATUS[code], code);
}

// Every command locks the caller's user row first so one player's concurrent
// commands serialize and cannot both pass the one-lobby-at-a-time check.
async function lockCaller(tx: Tx, userId: string) {
  const [user] = await tx
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .for("update");
  if (!user) throw lobbyError("unauthenticated");
  return user;
}

async function readBalance(q: Queryable, userId: string): Promise<number> {
  const [wallet] = await q
    .select({ balanceMnt: walletAccounts.balanceMnt })
    .from(walletAccounts)
    .where(eq(walletAccounts.userId, userId));
  return wallet?.balanceMnt ?? 0;
}

async function findMembership(
  q: Queryable,
  userId: string,
): Promise<Membership | null> {
  const [hosted] = await q
    .select({ lobbyId: lobbies.id })
    .from(lobbies)
    .where(and(eq(lobbies.hostUserId, userId), eq(lobbies.status, "open")))
    .limit(1);
  if (hosted) return { lobbyId: hosted.lobbyId, role: "host" };

  const [seated] = await q
    .select({ lobbyId: lobbyMembers.lobbyId })
    .from(lobbyMembers)
    .innerJoin(lobbies, eq(lobbies.id, lobbyMembers.lobbyId))
    .where(and(eq(lobbyMembers.userId, userId), eq(lobbies.status, "open")))
    .limit(1);
  return seated ? { lobbyId: seated.lobbyId, role: "member" } : null;
}

async function assertCanEnter(tx: Tx, userId: string): Promise<void> {
  const { status } = await lockCaller(tx, userId);
  const denial = entryDenial({
    status,
    balanceMnt: await readBalance(tx, userId),
    membership: await findMembership(tx, userId),
  });
  if (denial) throw lobbyError(denial);
}

export async function loadViewer(
  db: Database,
  userId: string,
): Promise<LobbyViewer> {
  const [balanceMnt, membership] = await Promise.all([
    readBalance(db, userId),
    findMembership(db, userId),
  ]);
  return {
    balanceMnt,
    lobbyId: membership?.lobbyId ?? null,
    role: membership?.role ?? null,
  };
}

export async function createLobby(
  db: Database,
  userId: string,
  name: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await assertCanEnter(tx, userId);
    await tx.insert(lobbies).values({ name, hostUserId: userId });
  });
}

export async function joinLobby(
  db: Database,
  userId: string,
  lobbyId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await assertCanEnter(tx, userId);

    const [lobby] = await tx
      .select({ status: lobbies.status })
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .for("update");
    if (!lobby) throw lobbyError("lobby_closed");

    const taken = await tx
      .select({ seat: lobbyMembers.seat })
      .from(lobbyMembers)
      .where(eq(lobbyMembers.lobbyId, lobbyId));
    const plan = planJoin(
      lobby.status,
      taken.map((t) => t.seat),
    );
    if (!plan.ok) throw lobbyError(plan.code);

    await tx.insert(lobbyMembers).values({ lobbyId, userId, seat: plan.seat });
  });
}

export async function leaveLobby(
  db: Database,
  userId: string,
  lobbyId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await lockCaller(tx, userId);

    const [lobby] = await tx
      .select({ status: lobbies.status, hostUserId: lobbies.hostUserId })
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .for("update");
    if (!lobby || lobby.status !== "open") throw lobbyError("lobby_closed");

    const members = await tx
      .select({
        userId: lobbyMembers.userId,
        seat: lobbyMembers.seat,
        seatedAt: lobbyMembers.seatedAt,
      })
      .from(lobbyMembers)
      .where(eq(lobbyMembers.lobbyId, lobbyId));

    const plan = planLeave(lobby.hostUserId, members, userId);
    if (plan.kind === "not_in_lobby") throw lobbyError("not_in_lobby");

    await tx
      .delete(lobbyMembers)
      .where(
        and(eq(lobbyMembers.lobbyId, lobbyId), eq(lobbyMembers.userId, userId)),
      );

    switch (plan.kind) {
      case "free_seat":
        return;
      case "transfer_host":
        await tx
          .update(lobbies)
          .set({ hostUserId: plan.hostUserId })
          .where(eq(lobbies.id, lobbyId));
        return;
      case "cancel":
        await tx
          .update(lobbies)
          .set({ status: "cancelled" })
          .where(eq(lobbies.id, lobbyId));
        return;
      default: {
        const unhandled: never = plan;
        throw new Error(`Unhandled leave plan ${JSON.stringify(unhandled)}`);
      }
    }
  });
}
