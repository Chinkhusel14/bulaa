import type { FastifyPluginAsync } from "fastify";

/** Draft HTTP helpers (state snapshot); picks stream over WS. */
export const draftModule: FastifyPluginAsync = async (app) => {
  app.get("/draft/:matchId", async (_req, reply) => {
    return reply.status(501).send({ error: { code: "not_implemented", message: "TODO" } });
  });
};
