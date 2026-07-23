import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import type { Env } from "../config/env";

export async function registerCors(app: FastifyInstance, env: Env) {
  await app.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
  });
}
