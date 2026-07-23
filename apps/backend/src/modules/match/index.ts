import type { FastifyPluginAsync } from "fastify";

/** Match lifecycle, score submit, server allocation hooks. */
export const matchModule: FastifyPluginAsync = async (app) => {
  app.get("/matches/:id", async (_req, reply) => {
    return reply.status(501).send({ error: { code: "not_implemented", message: "TODO" } });
  });
};
