import type { FastifyPluginAsync } from "fastify";

/** Tiered admin panel APIs (super / finance / match / skill / support). */
export const adminModule: FastifyPluginAsync = async (app) => {
  app.get("/admin/health", async () => ({ ok: true }));
};
