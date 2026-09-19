import type { FastifyInstance } from "fastify";
import Redis from "ioredis";
import type { Env } from "../config/env";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

export async function registerRedis(app: FastifyInstance, env: Env) {
  const redis = new Redis(env.REDIS_URL);
  app.decorate("redis", redis);
  app.addHook("onClose", async () => {
    redis.disconnect();
  });
}
