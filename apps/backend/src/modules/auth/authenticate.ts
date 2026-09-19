import { users } from "@bulaa/db";
import { eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../lib/errors";

declare module "fastify" {
  interface FastifyRequest {
    user: typeof users.$inferSelect;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
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

  if (user.status === "banned") {
    request.session.delete();
    throw new AppError("Account banned", 403, "unauthenticated");
  }

  request.user = user;
}
