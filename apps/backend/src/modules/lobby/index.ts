import {
  chatMessageSchema,
  createLobbySchema,
  moveSideSchema,
  setReadySchema,
  startVoteSchema,
  vetoMapSchema,
  voteBallotSchema,
  type LobbyListResponse,
  type LobbyRoom,
} from "@bulaa/shared";
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import { loadSessionUser } from "../auth/authenticate";
import {
  acceptMatch,
  castBallot,
  createLobby,
  declineMatch,
  joinLobby,
  leaveLobby,
  loadViewer,
  lobbyError,
  moveSide,
  postMessage,
  setReady,
  startVote,
  vetoMap,
  type MutationResult,
} from "./commands";
import { loadOpenLobbies, loadRoom, publishOpenLobbies, publishRoom } from "./snapshot";

const lobbyParamsSchema = z.object({ id: z.string().uuid() });
const voteParamsSchema = z.object({ id: z.string().uuid(), voteId: z.string().uuid() });

function parseLobbyId(request: FastifyRequest): string {
  const params = lobbyParamsSchema.safeParse(request.params);
  if (!params.success) throw lobbyError("lobby_closed");
  return params.data.id;
}

async function afterMutation(app: FastifyInstance, result: MutationResult) {
  await publishRoom(app, result.lobbyId);
  if (result.publishOpen) await publishOpenLobbies(app);
}

/** Play lobby browser and member room. No wallet writes. */
export const lobbyModule: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", loadSessionUser);

  app.get("/lobbies", async (request): Promise<LobbyListResponse> => {
    const [rows, viewer] = await Promise.all([
      loadOpenLobbies(app.db),
      loadViewer(app.db, request.user.id),
    ]);
    return { lobbies: rows, viewer, serverFeeMnt: app.env.SERVER_FEE_MNT };
  });

  app.post("/lobbies", async (request) => {
    const body = createLobbySchema.safeParse(request.body);
    if (!body.success) throw lobbyError("invalid_prize_pool");
    const result = await createLobby(
      app.db,
      request.user.id,
      body.data.prizePoolMnt,
      app.env.SERVER_FEE_MNT,
    );
    await afterMutation(app, result);
    return { ok: true as const, lobbyId: result.lobbyId };
  });

  app.get("/lobbies/:id", async (request): Promise<LobbyRoom> => {
    return loadRoom(app.db, parseLobbyId(request), request.user.id);
  });

  app.post("/lobbies/:id/join", async (request) => {
    const lobbyId = parseLobbyId(request);
    const result = await joinLobby(app.db, request.user.id, lobbyId);
    await afterMutation(app, result);
    return { ok: true as const, lobbyId: result.lobbyId };
  });

  app.post("/lobbies/:id/leave", async (request) => {
    const result = await leaveLobby(app.db, request.user.id, parseLobbyId(request));
    await afterMutation(app, result);
    return { ok: true };
  });

  app.post("/lobbies/:id/side", async (request) => {
    const body = moveSideSchema.safeParse(request.body);
    if (!body.success) throw lobbyError("lobby_closed");
    const result = await moveSide(app.db, request.user.id, parseLobbyId(request), body.data.side);
    await afterMutation(app, result);
    return { ok: true };
  });

  app.post("/lobbies/:id/ready", async (request) => {
    const body = setReadySchema.safeParse(request.body);
    if (!body.success) throw lobbyError("lobby_closed");
    const result = await setReady(app.db, request.user.id, parseLobbyId(request), body.data.ready);
    await afterMutation(app, result);
    return { ok: true };
  });

  app.post("/lobbies/:id/accept", async (request) => {
    const result = await acceptMatch(app.db, request.user.id, parseLobbyId(request));
    await afterMutation(app, result);
    return { ok: true };
  });

  app.post("/lobbies/:id/decline", async (request) => {
    const result = await declineMatch(app.db, request.user.id, parseLobbyId(request));
    await afterMutation(app, result);
    return { ok: true };
  });

  app.post("/lobbies/:id/messages", async (request) => {
    const body = chatMessageSchema.safeParse(request.body);
    if (!body.success) throw lobbyError("message_too_long");
    const result = await postMessage(app.db, request.user.id, parseLobbyId(request), body.data.body);
    await afterMutation(app, result);
    return { ok: true };
  });

  app.post("/lobbies/:id/votes", async (request) => {
    const body = startVoteSchema.safeParse(request.body);
    if (!body.success) throw lobbyError("vote_unavailable");
    const result = await startVote(
      app.db,
      request.user.id,
      parseLobbyId(request),
      body.data.targetUserId,
    );
    await afterMutation(app, result);
    return { ok: true };
  });

  app.post("/lobbies/:id/votes/:voteId", async (request) => {
    const params = voteParamsSchema.safeParse(request.params);
    if (!params.success) throw lobbyError("vote_unavailable");
    const body = voteBallotSchema.safeParse(request.body);
    if (!body.success) throw lobbyError("vote_unavailable");
    const result = await castBallot(
      app.db,
      request.user.id,
      params.data.id,
      params.data.voteId,
      body.data.yes,
    );
    await afterMutation(app, result);
    return { ok: true };
  });

  app.post("/lobbies/:id/veto", async (request) => {
    const body = vetoMapSchema.safeParse(request.body);
    if (!body.success) throw lobbyError("map_taken");
    const result = await vetoMap(app.db, request.user.id, parseLobbyId(request), body.data.map);
    await afterMutation(app, result);
    return { ok: true };
  });
};
