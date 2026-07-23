import type { FastifyPluginAsync } from "fastify";

/** Profiles, Steam link, skill tier reads. */
export const usersModule: FastifyPluginAsync = async (app) => {
  app.get("/users/me", async (_req, reply) => {
    return reply.status(501).send({ error: { code: "not_implemented", message: "TODO" } });
  });
};
