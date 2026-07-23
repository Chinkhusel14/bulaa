import type { FastifyPluginAsync } from "fastify";

/** Steam OpenID + phone OTP — implement per PRD § auth. */
export const authModule: FastifyPluginAsync = async (app) => {
  app.get("/auth/status", async () => ({ ready: false }));
};
