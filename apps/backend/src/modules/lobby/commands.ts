import {
  lobbies,
  lobbyMapActions,
  lobbyMembers,
  lobbyMessages,
  lobbyVoteBallots,
  lobbyVotes,
  users,
  walletAccounts,
  type Database,
} from "@bulaa/db";
import {
  ACTIVE_LOBBY_STATUSES,
  CHAT_MAX_LENGTH,
  CHAT_RATE_COUNT,
  CHAT_RATE_WINDOW_MS,
  DRAFT_PICK_SECONDS,
  MATCH_ACCEPT_SECONDS,
  VOTE_COOLDOWN_MS,
  VOTE_MIN_MEMBERS,
  VOTE_SECONDS,
  VETO_STEPS,
  lobbyCostMnt,
  type AccountStatus,
  type LobbyErrorCode,
  type LobbyViewer,
  type MapId,
  type Side,
} from "@bulaa/shared";
import { and, eq, gt, inArray, lte, sql } from "drizzle-orm";
import { AppError } from "../../lib/errors";
import {
  captains,
  canOpenAccept,
  entryDenial,
  packMembers,
  planAccept,
  planJoin,
  planLeave,
  planMove,
  planVeto,
  voteThreshold,
  type AcceptPlan,
  type LobbyMember,
  type Membership,
  type PhaseDeadlineUpdate,
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
  invalid_prize_pool: 400,
  side_full: 409,
  same_side: 409,
  roster_frozen: 409,
  not_captain: 403,
  not_your_turn: 403,
  map_taken: 409,
  vote_unavailable: 409,
  vote_cooldown: 409,
  already_voting: 409,
  chat_rate_limited: 429,
  message_too_long: 400,
  not_accepting: 409,
};

export function lobbyError(code: LobbyErrorCode): AppError {
  return new AppError(code, ERROR_STATUS[code], code);
}

export interface MutationResult {
  lobbyId: string;
  publishOpen: boolean;
}

function deadlineAt(kind: PhaseDeadlineUpdate, now = new Date()): Date | null | undefined {
  switch (kind) {
    case "accept":
      return new Date(now.getTime() + MATCH_ACCEPT_SECONDS * 1000);
    case "veto":
      return new Date(now.getTime() + DRAFT_PICK_SECONDS * 1000);
    case null:
      return null;
    case "keep":
      return undefined;
    default: {
      const unhandled: never = kind;
      return unhandled;
    }
  }
}

async function lockCaller(tx: Tx, userId: string) {
  const [user] = await tx
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .for("update");
  if (!user) throw lobbyError("unauthenticated");
  return user;
}

async function lockLobby(tx: Tx, lobbyId: string) {
  const [lobby] = await tx.select().from(lobbies).where(eq(lobbies.id, lobbyId)).for("update");
  if (!lobby) throw lobbyError("lobby_closed");
  return lobby;
}

async function readBalance(q: Queryable, userId: string): Promise<number> {
  const [wallet] = await q
    .select({ balanceMnt: walletAccounts.balanceMnt })
    .from(walletAccounts)
    .where(eq(walletAccounts.userId, userId));
  return wallet?.balanceMnt ?? 0;
}

export async function findMembership(q: Queryable, userId: string): Promise<Membership | null> {
  const [row] = await q
    .select({ lobbyId: lobbyMembers.lobbyId, hostUserId: lobbies.hostUserId })
    .from(lobbyMembers)
    .innerJoin(lobbies, eq(lobbies.id, lobbyMembers.lobbyId))
    .where(
      and(eq(lobbyMembers.userId, userId), inArray(lobbies.status, [...ACTIVE_LOBBY_STATUSES])),
    )
    .limit(1);
  return row
    ? { lobbyId: row.lobbyId, role: row.hostUserId === userId ? "host" : "member" }
    : null;
}

async function assertCanEnter(
  tx: Tx,
  userId: string,
  status: AccountStatus,
  costMnt: number,
): Promise<void> {
  const denial = entryDenial({
    status,
    costMnt,
    balanceMnt: await readBalance(tx, userId),
    membership: await findMembership(tx, userId),
  });
  if (denial) throw lobbyError(denial);
}

async function loadMembers(tx: Tx, lobbyId: string): Promise<LobbyMember[]> {
  return tx
    .select({
      userId: lobbyMembers.userId,
      side: lobbyMembers.side,
      slot: lobbyMembers.slot,
      joinedAt: lobbyMembers.joinedAt,
      ready: lobbyMembers.ready,
      accepted: lobbyMembers.accepted,
    })
    .from(lobbyMembers)
    .where(eq(lobbyMembers.lobbyId, lobbyId));
}

async function persistPackedMembers(tx: Tx, lobbyId: string, members: readonly LobbyMember[]) {
  await tx
    .update(lobbyMembers)
    .set({ slot: sql`${lobbyMembers.slot} + 10` })
    .where(eq(lobbyMembers.lobbyId, lobbyId));
  for (const member of members) {
    await tx
      .update(lobbyMembers)
      .set({
        side: member.side,
        slot: member.slot,
        ready: member.ready,
        accepted: member.accepted,
      })
      .where(and(eq(lobbyMembers.lobbyId, lobbyId), eq(lobbyMembers.userId, member.userId)));
  }
}

async function persistAccept(tx: Tx, lobbyId: string, plan: AcceptPlan): Promise<void> {
  if (!plan.ok) throw lobbyError(plan.code);
  await persistPackedMembers(tx, lobbyId, plan.members);
  const deadline = deadlineAt(plan.phaseDeadline);
  await tx
    .update(lobbies)
    .set({
      status: plan.status,
      vetoStep: plan.vetoStep,
      ...(deadline === undefined ? {} : { phaseDeadline: deadline }),
    })
    .where(eq(lobbies.id, lobbyId));
}

function requireMember(members: readonly LobbyMember[], userId: string): LobbyMember {
  const member = members.find((m) => m.userId === userId);
  if (!member) throw lobbyError("not_in_lobby");
  return member;
}

function assertWritableRoster(status: (typeof lobbies.$inferSelect)["status"]): void {
  switch (status) {
    case "open":
    case "accepting":
      return;
    case "veto":
      throw lobbyError("roster_frozen");
    case "starting":
    case "awaiting_server":
    case "live":
    case "awaiting_result":
    case "completed":
    case "cancelled":
    case "disputed":
      throw lobbyError("lobby_closed");
    default: {
      const unhandled: never = status;
      throw lobbyError(unhandled);
    }
  }
}

async function removeMember(
  tx: Tx,
  lobby: typeof lobbies.$inferSelect,
  members: readonly LobbyMember[],
  targetId: string,
): Promise<void> {
  assertWritableRoster(lobby.status);
  const leave = planLeave(lobby.hostUserId, members, targetId);
  if (leave.kind === "not_in_lobby") throw lobbyError("not_in_lobby");

  const remaining = packMembers(members.filter((m) => m.userId !== targetId));
  await tx
    .delete(lobbyMembers)
    .where(and(eq(lobbyMembers.lobbyId, lobby.id), eq(lobbyMembers.userId, targetId)));

  switch (leave.kind) {
    case "cancel":
      await tx
        .update(lobbies)
        .set({ status: "cancelled", phaseDeadline: null })
        .where(eq(lobbies.id, lobby.id));
      return;
    case "transfer_host":
      await tx
        .update(lobbies)
        .set({ hostUserId: leave.hostUserId })
        .where(eq(lobbies.id, lobby.id));
      break;
    case "free_seat":
      break;
    default: {
      const unhandled: never = leave;
      throw new Error(`Unhandled leave plan ${JSON.stringify(unhandled)}`);
    }
  }

  if (lobby.status === "accepting") {
    await persistAccept(tx, lobby.id, planAccept("accepting", remaining, { kind: "roster_changed" }));
    return;
  }
  await persistPackedMembers(tx, lobby.id, remaining);
}

export async function loadViewer(db: Database, userId: string): Promise<LobbyViewer> {
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
  prizePoolMnt: number,
  serverFeeMnt: number,
): Promise<MutationResult> {
  const lobbyId = await db.transaction(async (tx) => {
    const { status } = await lockCaller(tx, userId);
    await assertCanEnter(tx, userId, status, lobbyCostMnt(prizePoolMnt, serverFeeMnt));
    const [lobby] = await tx
      .insert(lobbies)
      .values({ prizePoolMnt, serverFeeMnt, hostUserId: userId })
      .returning({ id: lobbies.id });
    if (!lobby) throw new Error("Lobby insert returned no row");
    await tx.insert(lobbyMembers).values({ lobbyId: lobby.id, userId, side: "a", slot: 0 });
    return lobby.id;
  });
  return { lobbyId, publishOpen: true };
}

export async function joinLobby(
  db: Database,
  userId: string,
  lobbyId: string,
): Promise<MutationResult> {
  await db.transaction(async (tx) => {
    const { status } = await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    await assertCanEnter(
      tx,
      userId,
      status,
      lobbyCostMnt(lobby.prizePoolMnt, lobby.serverFeeMnt),
    );
    const members = await loadMembers(tx, lobbyId);
    const plan = planJoin(lobby.status, members);
    if (!plan.ok) throw lobbyError(plan.code);
    await tx.insert(lobbyMembers).values({
      lobbyId,
      userId,
      side: plan.side,
      slot: plan.slot,
    });
  });
  return { lobbyId, publishOpen: true };
}

export async function leaveLobby(
  db: Database,
  userId: string,
  lobbyId: string,
): Promise<MutationResult> {
  await db.transaction(async (tx) => {
    await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    const members = await loadMembers(tx, lobbyId);
    await removeMember(tx, lobby, members, userId);
  });
  return { lobbyId, publishOpen: true };
}

export async function moveSide(
  db: Database,
  userId: string,
  lobbyId: string,
  targetSide: Side,
): Promise<MutationResult> {
  const publishOpen = await db.transaction(async (tx) => {
    await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    assertWritableRoster(lobby.status);
    const members = await loadMembers(tx, lobbyId);
    requireMember(members, userId);
    const plan = planMove(members, userId, targetSide);
    if (!plan.ok) throw lobbyError(plan.code);
    if (lobby.status === "accepting") {
      await persistAccept(
        tx,
        lobbyId,
        planAccept("accepting", plan.members, { kind: "roster_changed" }),
      );
      return true;
    }
    await persistPackedMembers(tx, lobbyId, plan.members);
    return lobby.status === "open";
  });
  return { lobbyId, publishOpen };
}

export async function setReady(
  db: Database,
  userId: string,
  lobbyId: string,
  ready: boolean,
): Promise<MutationResult> {
  const publishOpen = await db.transaction(async (tx) => {
    await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    const members = await loadMembers(tx, lobbyId);
    requireMember(members, userId);

    if (lobby.status === "accepting" && ready === false) {
      await persistAccept(
        tx,
        lobbyId,
        planAccept("accepting", members, { kind: "declined", userId }),
      );
      return true;
    }
    if (lobby.status !== "open") throw lobbyError("lobby_closed");

    const next = members.map((m) => (m.userId === userId ? { ...m, ready } : m));
    if (ready && canOpenAccept(next)) {
      await persistAccept(tx, lobbyId, planAccept("open", next, { kind: "all_ready" }));
      return true;
    }
    await persistPackedMembers(tx, lobbyId, next);
    return true;
  });
  return { lobbyId, publishOpen };
}

export async function acceptMatch(
  db: Database,
  userId: string,
  lobbyId: string,
): Promise<MutationResult> {
  await db.transaction(async (tx) => {
    await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    const members = await loadMembers(tx, lobbyId);
    requireMember(members, userId);
    await persistAccept(tx, lobbyId, planAccept(lobby.status, members, { kind: "accepted", userId }));
  });
  return { lobbyId, publishOpen: false };
}

export async function declineMatch(
  db: Database,
  userId: string,
  lobbyId: string,
): Promise<MutationResult> {
  await db.transaction(async (tx) => {
    await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    const members = await loadMembers(tx, lobbyId);
    requireMember(members, userId);
    await persistAccept(
      tx,
      lobbyId,
      planAccept(lobby.status, members, { kind: "declined", userId }),
    );
  });
  return { lobbyId, publishOpen: true };
}

export async function postMessage(
  db: Database,
  userId: string,
  lobbyId: string,
  body: string,
): Promise<MutationResult> {
  if (body.length > CHAT_MAX_LENGTH || body.trim().length === 0) {
    throw lobbyError("message_too_long");
  }
  await db.transaction(async (tx) => {
    await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    const members = await loadMembers(tx, lobbyId);
    requireMember(members, userId);
    switch (lobby.status) {
      case "open":
      case "accepting":
      case "veto":
      case "awaiting_server":
        break;
      case "starting":
      case "live":
      case "awaiting_result":
      case "completed":
      case "cancelled":
      case "disputed":
        throw lobbyError("lobby_closed");
      default: {
        const unhandled: never = lobby.status;
        throw lobbyError(unhandled);
      }
    }
    const recent = await tx
      .select({ id: lobbyMessages.id })
      .from(lobbyMessages)
      .where(
        and(
          eq(lobbyMessages.lobbyId, lobbyId),
          eq(lobbyMessages.userId, userId),
          gt(lobbyMessages.createdAt, new Date(Date.now() - CHAT_RATE_WINDOW_MS)),
        ),
      );
    if (recent.length >= CHAT_RATE_COUNT) throw lobbyError("chat_rate_limited");
    await tx.insert(lobbyMessages).values({ lobbyId, userId, body });
  });
  return { lobbyId, publishOpen: false };
}

export async function startVote(
  db: Database,
  userId: string,
  lobbyId: string,
  targetUserId: string,
): Promise<MutationResult> {
  await db.transaction(async (tx) => {
    await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    if (lobby.status !== "open" && lobby.status !== "accepting") {
      throw lobbyError("vote_unavailable");
    }
    const members = await loadMembers(tx, lobbyId);
    requireMember(members, userId);
    if (userId === targetUserId || !members.some((m) => m.userId === targetUserId)) {
      throw lobbyError("vote_unavailable");
    }
    if (members.length < VOTE_MIN_MEMBERS) throw lobbyError("vote_unavailable");

    const [openVote] = await tx
      .select({ id: lobbyVotes.id })
      .from(lobbyVotes)
      .where(and(eq(lobbyVotes.lobbyId, lobbyId), eq(lobbyVotes.status, "open")))
      .limit(1);
    if (openVote) throw lobbyError("already_voting");

    const [recent] = await tx
      .select({ id: lobbyVotes.id })
      .from(lobbyVotes)
      .where(
        and(
          eq(lobbyVotes.lobbyId, lobbyId),
          eq(lobbyVotes.targetUserId, targetUserId),
          inArray(lobbyVotes.status, ["passed", "failed"]),
          gt(lobbyVotes.endsAt, new Date(Date.now() - VOTE_COOLDOWN_MS)),
        ),
      )
      .limit(1);
    if (recent) throw lobbyError("vote_cooldown");

    const [vote] = await tx
      .insert(lobbyVotes)
      .values({
        lobbyId,
        targetUserId,
        startedBy: userId,
        endsAt: new Date(Date.now() + VOTE_SECONDS * 1000),
      })
      .returning({ id: lobbyVotes.id });
    if (!vote) throw new Error("Vote insert returned no row");
    await tx.insert(lobbyVoteBallots).values({ voteId: vote.id, userId, yes: true });
  });
  return { lobbyId, publishOpen: false };
}

export async function castBallot(
  db: Database,
  userId: string,
  lobbyId: string,
  voteId: string,
  yes: boolean,
): Promise<MutationResult> {
  const publishOpen = await db.transaction(async (tx) => {
    await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    if (lobby.status !== "open" && lobby.status !== "accepting") {
      throw lobbyError("vote_unavailable");
    }
    const members = await loadMembers(tx, lobbyId);
    requireMember(members, userId);

    const [vote] = await tx
      .select()
      .from(lobbyVotes)
      .where(and(eq(lobbyVotes.id, voteId), eq(lobbyVotes.lobbyId, lobbyId)))
      .for("update");
    if (!vote) throw lobbyError("vote_unavailable");
    if (vote.status !== "open" || vote.endsAt.getTime() <= Date.now()) {
      if (vote.status === "open") {
        await tx.update(lobbyVotes).set({ status: "failed" }).where(eq(lobbyVotes.id, vote.id));
      }
      throw lobbyError("vote_unavailable");
    }
    if (vote.targetUserId === userId) throw lobbyError("vote_unavailable");

    const [existing] = await tx
      .select({ userId: lobbyVoteBallots.userId })
      .from(lobbyVoteBallots)
      .where(and(eq(lobbyVoteBallots.voteId, vote.id), eq(lobbyVoteBallots.userId, userId)));
    if (existing) throw lobbyError("already_voting");

    await tx.insert(lobbyVoteBallots).values({ voteId: vote.id, userId, yes });
    const ballots = await tx
      .select({ yes: lobbyVoteBallots.yes })
      .from(lobbyVoteBallots)
      .where(eq(lobbyVoteBallots.voteId, vote.id));
    const yesCount = ballots.filter((b) => b.yes).length;
    if (yesCount < voteThreshold(members.length)) return false;

    await tx
      .update(lobbyVotes)
      .set({ status: "passed", endsAt: new Date() })
      .where(eq(lobbyVotes.id, vote.id));
    await removeMember(tx, lobby, members, vote.targetUserId);
    return true;
  });
  return { lobbyId, publishOpen };
}

export async function vetoMap(
  db: Database,
  userId: string,
  lobbyId: string,
  map: MapId,
): Promise<MutationResult> {
  await db.transaction(async (tx) => {
    await lockCaller(tx, userId);
    const lobby = await lockLobby(tx, lobbyId);
    if (lobby.status !== "veto") throw lobbyError("lobby_closed");
    const members = await loadMembers(tx, lobbyId);
    const actor = requireMember(members, userId);
    const step = VETO_STEPS[lobby.vetoStep];
    if (!step || !("side" in step)) throw lobbyError("lobby_closed");
    const caps = captains(members);
    if (caps[step.side] !== userId) {
      throw lobbyError(actor.side === step.side ? "not_captain" : "not_your_turn");
    }
    const used = await tx
      .select({ map: lobbyMapActions.map })
      .from(lobbyMapActions)
      .where(eq(lobbyMapActions.lobbyId, lobbyId));
    const plan = planVeto(
      lobby.vetoStep,
      used.map((row) => row.map),
      { kind: "pick", map, actorSide: actor.side },
      Math.random,
    );
    if (!plan.ok) throw lobbyError(plan.code);
    await persistVetoPlan(tx, lobbyId, plan);
  });
  return { lobbyId, publishOpen: false };
}

async function persistVetoPlan(
  tx: Tx,
  lobbyId: string,
  plan: Extract<ReturnType<typeof planVeto>, { ok: true }>,
): Promise<void> {
  for (const action of plan.actions) {
    await tx.insert(lobbyMapActions).values({
      lobbyId,
      step: action.step,
      map: action.map,
      action: action.action,
      side: action.side,
    });
  }
  await tx
    .update(lobbies)
    .set({
      status: plan.status,
      vetoStep: plan.vetoStep,
      phaseDeadline: deadlineAt(plan.phaseDeadline),
    })
    .where(eq(lobbies.id, lobbyId));
}

export async function sweepDueLobbies(db: Database): Promise<MutationResult[]> {
  return db.transaction(async (tx) => {
    const due = await tx
      .select()
      .from(lobbies)
      .where(
        and(inArray(lobbies.status, ["accepting", "veto"]), lte(lobbies.phaseDeadline, new Date())),
      )
      .for("update", { skipLocked: true });
    const results: MutationResult[] = [];
    for (const lobby of due) {
      if (lobby.status === "accepting") {
        const members = await loadMembers(tx, lobby.id);
        await persistAccept(tx, lobby.id, planAccept("accepting", members, { kind: "timeout" }));
        results.push({ lobbyId: lobby.id, publishOpen: true });
        continue;
      }
      if (lobby.status === "veto") {
        const used = await tx
          .select({ map: lobbyMapActions.map })
          .from(lobbyMapActions)
          .where(eq(lobbyMapActions.lobbyId, lobby.id));
        const plan = planVeto(
          lobby.vetoStep,
          used.map((row) => row.map),
          { kind: "timeout" },
          Math.random,
        );
        if (!plan.ok) continue;
        await persistVetoPlan(tx, lobby.id, plan);
        results.push({ lobbyId: lobby.id, publishOpen: false });
      }
    }

    const expiredVotes = await tx
      .select()
      .from(lobbyVotes)
      .where(and(eq(lobbyVotes.status, "open"), sql`${lobbyVotes.endsAt} <= now()`))
      .for("update", { skipLocked: true });
    for (const vote of expiredVotes) {
      await tx.update(lobbyVotes).set({ status: "failed" }).where(eq(lobbyVotes.id, vote.id));
      results.push({ lobbyId: vote.lobbyId, publishOpen: false });
    }
    return results;
  });
}

export async function assertRoomMember(db: Database, lobbyId: string, userId: string): Promise<void> {
  const [row] = await db
    .select({ userId: lobbyMembers.userId })
    .from(lobbyMembers)
    .innerJoin(lobbies, eq(lobbies.id, lobbyMembers.lobbyId))
    .where(
      and(
        eq(lobbyMembers.lobbyId, lobbyId),
        eq(lobbyMembers.userId, userId),
        inArray(lobbies.status, [...ACTIVE_LOBBY_STATUSES]),
      ),
    )
    .limit(1);
  if (!row) throw lobbyError("not_in_lobby");
}