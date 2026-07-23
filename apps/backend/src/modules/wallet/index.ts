import type { FastifyPluginAsync } from "fastify";

/** Wallet balance, ledger, escrow holds. */
export const walletModule: FastifyPluginAsync = async (app) => {
  app.get("/wallet", async (_req, reply) => {
    return reply.status(501).send({ error: { code: "not_implemented", message: "TODO" } });
  });
};
