import { users } from "@bulaa/db";
import { eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../../lib/errors";
import {
  ensureDevPersonas,
  listDevPersonas,
  resolveDevUserId,
} from "./personas";

const devLabelSchema = z
  .string()
  .regex(/^player-\d+$/, "label must look like player-1");

const devSessionBodySchema = z
  .object({
    userId: z.string().uuid().optional(),
    label: devLabelSchema.optional(),
  })
  .refine((body) => body.userId != null || body.label != null, {
    message: "Provide userId or label",
  });

/** Local-only session switch and seeded lobby personas. Not registered outside development. */
export const devModule: FastifyPluginAsync = async (app) => {
  await ensureDevPersonas(app.db);

  app.get("/dev/users", async () => {
    const personas = await listDevPersonas(app.db);
    return { personas };
  });

  app.post("/dev/session", async (request, reply) => {
    const body = devSessionBodySchema.safeParse(request.body);
    if (!body.success) {
      throw new AppError("Invalid dev session body", 400, "invalid_request");
    }

    const userId = await resolveDevUserId(app.db, body.data);
    if (!userId) {
      throw new AppError("User not found", 404, "user_not_found");
    }

    const [user] = await app.db
      .select({
        id: users.id,
        displayName: users.displayName,
        steamId: users.steamId,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      throw new AppError("User not found", 404, "user_not_found");
    }

    request.session.set("userId", user.id);

    return reply.send({
      ok: true,
      user: {
        id: user.id,
        displayName: user.displayName,
        status: user.status,
        label: user.steamId.startsWith("dev:")
          ? user.steamId.slice("dev:".length)
          : null,
      },
    });
  });
};
