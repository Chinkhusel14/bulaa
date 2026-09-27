import { createLobbySchema, type LobbyListResponse } from "@bulaa/shared";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import { loadSessionUser } from "../auth/authenticate";
import {
  createLobby,
  joinLobby,
  leaveLobby,
  loadViewer,
  lobbyError,
} from "./commands";
import { loadOpenLobbies, publishOpenLobbies } from "./snapshot";

const lobbyParamsSchema = z.object({ id: z.string().uuid() });

function parseLobbyId(request: FastifyRequest): string {
  const params = lobbyParamsSchema.safeParse(request.params);
  if (!params.success) throw lobbyError("lobby_closed");
  return params.data.id;
}

/** Play lobby browser: list, create, join, leave. No wallet writes. */
export const lobbyModule: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", loadSessionUser);

  app.get("/lobbies", async (request): Promise<LobbyListResponse> => {
    const [lobbies, viewer] = await Promise.all([
      loadOpenLobbies(app.db),
      loadViewer(app.db, request.user.id),
    ]);
    return { lobbies, viewer };
  });

  app.post("/lobbies", async (request) => {
    const body = createLobbySchema.safeParse(request.body);
    if (!body.success) throw lobbyError("invalid_name");
    await createLobby(app.db, request.user.id, body.data.name);
    await publishOpenLobbies(app);
    return { ok: true };
  });

  app.post("/lobbies/:id/join", async (request) => {
    await joinLobby(app.db, request.user.id, parseLobbyId(request));
    await publishOpenLobbies(app);
    return { ok: true };
  });

  app.post("/lobbies/:id/leave", async (request) => {
    await leaveLobby(app.db, request.user.id, parseLobbyId(request));
    await publishOpenLobbies(app);
    return { ok: true };
  });
};
