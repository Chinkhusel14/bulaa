import { users } from "@bulaa/db";
import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify";
import { AppError } from "../../lib/errors";

declare module "fastify" {
  interface FastifyRequest {
    user: typeof users.$inferSelect;
  }
}

/** Loads the session user and keeps the session for banned users, who may still read. */
export async function loadSessionUser(request: FastifyRequest): Promise<void> {
  const userId = request.session.get("userId");
  if (!userId) throw new AppError("Unauthenticated", 401, "unauthenticated");

  const [user] = await request.server.db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    request.session.delete();
    throw new AppError("Unauthenticated", 401, "unauthenticated");
  }

  request.user = user;
}

export async function authenticate(request: FastifyRequest): Promise<void> {
  await loadSessionUser(request);

  if (request.user.status === "banned") {
    request.session.delete();
    throw new AppError("Account banned", 403, "unauthenticated");
  }
}
