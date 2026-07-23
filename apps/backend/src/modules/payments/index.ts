import type { FastifyPluginAsync } from "fastify";

/** QPay deposits + provider webhooks (idempotent). */
export const paymentsModule: FastifyPluginAsync = async (app) => {
  app.post("/payments/qpay/webhook", async (_req, reply) => {
    return reply.status(501).send({ error: { code: "not_implemented", message: "TODO" } });
  });
};
