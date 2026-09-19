import cookie from "@fastify/cookie";
import secureSession from "@fastify/secure-session";
import type { FastifyInstance } from "fastify";
import type { Env } from "../config/env";

declare module "@fastify/secure-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerSession(app: FastifyInstance, env: Env) {
  await app.register(cookie);
  await app.register(secureSession, {
    key: Buffer.from(env.SESSION_SECRET.padEnd(32, "\0").slice(0, 32)),
    cookieName: "bulaa_session",
    cookie: {
      path: "/",
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60,
    },
  });
}
