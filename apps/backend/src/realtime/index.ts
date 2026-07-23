import type { FastifyInstance } from "fastify";
import { registerDraftWs } from "./draft";
import { registerQueueWs } from "./queue";

export async function registerRealtime(app: FastifyInstance) {
  await registerQueueWs(app);
  await registerDraftWs(app);
}
