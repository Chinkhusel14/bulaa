import type { FastifyPluginAsync } from "fastify";

/** HTTP queue controls; live state lives in realtime WS. */
export const queueModule: FastifyPluginAsync = async (app) => {
  app.get("/queue/status", async () => ({
    state: "idle",
  }));
};
