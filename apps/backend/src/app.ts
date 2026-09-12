import Fastify from "fastify";
import type { Env } from "./config/env";
import { errorHandler } from "./lib/errors";
import {
  adminModule,
  authModule,
  draftModule,
  healthModule,
  matchModule,
  paymentsModule,
  queueModule,
  usersModule,
  walletModule,
} from "./modules";
import { registerCors } from "./plugins/cors";
import { registerDb } from "./plugins/db";
import { registerRedis } from "./plugins/redis";
import { registerSession } from "./plugins/session";
import { registerWebsocket } from "./plugins/websocket";
import { registerRealtime } from "./realtime";

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
  }
}

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  app.decorate("env", env);
  app.setErrorHandler(errorHandler);

  await registerDb(app, env);
  await registerRedis(app, env);
  await registerCors(app, env);
  await registerSession(app, env);
  await registerWebsocket(app);

  await app.register(healthModule);
  await app.register(authModule, { prefix: "/api" });
  await app.register(usersModule, { prefix: "/api" });
  await app.register(walletModule, { prefix: "/api" });
  await app.register(paymentsModule, { prefix: "/api" });
  await app.register(matchModule, { prefix: "/api" });
  await app.register(queueModule, { prefix: "/api" });
  await app.register(draftModule, { prefix: "/api" });
  await app.register(adminModule, { prefix: "/api" });

  await registerRealtime(app);

  return app;
}
