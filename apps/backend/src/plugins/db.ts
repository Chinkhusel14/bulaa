import { createDb, type Database } from "@bulaa/db";
import type { FastifyInstance } from "fastify";
import type { Env } from "../config/env";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

export async function registerDb(app: FastifyInstance, env: Env) {
  const db = createDb(env.DATABASE_URL);
  app.decorate("db", db);
}
