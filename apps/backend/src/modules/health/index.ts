import type { FastifyPluginAsync } from "fastify";

export const healthModule: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    ok: true,
    service: "backend",
  }));
};
