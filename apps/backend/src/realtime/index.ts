import type { FastifyInstance } from "fastify";
import { registerDraftWs } from "./draft";
import { registerLobbiesWs } from "./lobbies";
import { registerQueueWs } from "./queue";
import { registerRoomWs } from "./room";

export async function registerRealtime(app: FastifyInstance) {
  await registerQueueWs(app);
  await registerDraftWs(app);
  await registerLobbiesWs(app);
  await registerRoomWs(app);
}
