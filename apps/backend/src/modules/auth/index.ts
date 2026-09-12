import { users, walletAccounts } from "@bulaa/db";
import { phoneRequestSchema, phoneVerifySchema } from "@bulaa/shared";
import { eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../lib/errors";
import { authenticate } from "./authenticate";
import { checkEligibility } from "./eligibility";
import {
  canSendOtp,
  generateOtp,
  storeOtp,
  verifyOtp,
} from "./phone";
import { CallProSms } from "./sms/callpro";
import { ConsoleSms } from "./sms/console";
import type { SmsSender } from "./sms/sender";
import {
  buildSteamRedirectUrl,
  verifySteamCallback,
} from "./steam-openid";
import { fetchSteamSnapshot } from "./steam-web-api";

export const authModule: FastifyPluginAsync = async (app) => {
  const env = app.env;
  const otpPepper = env.OTP_PEPPER || env.SESSION_SECRET;

  const sms: SmsSender =
    env.SMS_PROVIDER === "callpro"
      ? new CallProSms(
          env.CALLPRO_API_KEY!,
          env.CALLPRO_FROM!,
          env.CALLPRO_ENDPOINT,
        )
      : new ConsoleSms();

  app.get("/auth/steam", async (_request, reply) => {
    const url = buildSteamRedirectUrl(env.STEAM_REALM, env.STEAM_RETURN_URL);
    return reply.redirect(url);
  });

  app.get("/auth/steam/callback", async (request, reply) => {
    const query = request.query as Record<string, string>;
    const steamId = await verifySteamCallback(query);
    if (!steamId) {
      return reply.redirect(
        `${env.FRONT_URL}/auth/error?code=unauthenticated`,
      );
    }

    if (!env.STEAM_WEB_API_KEY) {
      return reply.redirect(
        `${env.FRONT_URL}/auth/error?code=steam_profile_private`,
      );
    }

    const snapshot = await fetchSteamSnapshot(steamId, env.STEAM_WEB_API_KEY);
    if (!snapshot) {
      return reply.redirect(
        `${env.FRONT_URL}/auth/error?code=steam_profile_private`,
      );
    }

    const result = checkEligibility(snapshot, {
      minAccountAgeDays: env.AUTH_MIN_ACCOUNT_AGE_DAYS,
      minCs2Hours: env.AUTH_MIN_CS2_HOURS,
    });

    if (!result.ok) {
      return reply.redirect(
        `${env.FRONT_URL}/auth/error?code=${result.code}`,
      );
    }

    const [existing] = await app.db
      .select()
      .from(users)
      .where(eq(users.steamId, steamId))
      .limit(1);

    let userId: string;

    if (existing) {
      userId = existing.id;
      await app.db
        .update(users)
        .set({
          displayName: snapshot.displayName,
          avatarUrl: snapshot.avatarUrl,
          steamCreatedAt: snapshot.steamCreatedAt,
          cs2Minutes: snapshot.cs2Minutes,
          vacBanned: snapshot.vacBanned,
          gameBanned: snapshot.gameBanned,
          lastSteamCheckAt: new Date(),
        })
        .where(eq(users.id, existing.id));

      if (existing.status === "active") {
        request.session.set("userId", userId);
        return reply.redirect(env.FRONT_URL);
      }
    } else {
      const [newUser] = await app.db.transaction(async (tx) => {
        const [u] = await tx
          .insert(users)
          .values({
            steamId: snapshot.steamId,
            displayName: snapshot.displayName,
            avatarUrl: snapshot.avatarUrl,
            steamCreatedAt: snapshot.steamCreatedAt,
            cs2Minutes: snapshot.cs2Minutes,
            vacBanned: snapshot.vacBanned,
            gameBanned: snapshot.gameBanned,
            lastSteamCheckAt: new Date(),
          })
          .returning();
        await tx.insert(walletAccounts).values({ userId: u!.id });
        return [u!];
      });
      userId = newUser.id;
    }

    request.session.set("userId", userId);
    return reply.redirect(`${env.FRONT_URL}/auth/phone`);
  });

  app.post(
    "/auth/phone/request",
    { preHandler: [authenticate] },
    async (request, reply) => {
      if (request.user.status !== "pending_phone") {
        throw new AppError("Already verified", 400, "already_verified");
      }

      const body = phoneRequestSchema.parse(request.body);

      const [existingPhone] = await app.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phoneE164, body.phone))
        .limit(1);
      if (existingPhone && existingPhone.id !== request.user.id) {
        throw new AppError("Phone already in use", 409, "phone_in_use");
      }

      const rateCheck = await canSendOtp(app.redis, body.phone);
      if (!rateCheck.allowed) {
        throw new AppError("Rate limited", 429, rateCheck.reason!);
      }

      const code = generateOtp();
      await storeOtp(app.redis, body.phone, code, otpPepper);
      await sms.send(body.phone, `Bulaa код: ${code}`);

      return reply.send({ ok: true });
    },
  );

  app.post(
    "/auth/phone/verify",
    { preHandler: [authenticate] },
    async (request, reply) => {
      if (request.user.status !== "pending_phone") {
        throw new AppError("Already verified", 400, "already_verified");
      }

      const body = phoneVerifySchema.parse(request.body);

      const result = await verifyOtp(
        app.redis,
        body.phone,
        body.code,
        otpPepper,
      );
      if (!result.valid) {
        throw new AppError(
          result.reason === "otp_expired"
            ? "Code expired"
            : result.reason === "otp_locked"
              ? "Too many attempts"
              : "Invalid code",
          400,
          result.reason!,
        );
      }

      await app.db
        .update(users)
        .set({
          phoneE164: body.phone,
          phoneVerifiedAt: new Date(),
          status: "active",
        })
        .where(eq(users.id, request.user.id));

      return reply.send({ ok: true });
    },
  );

  app.get(
    "/auth/me",
    { preHandler: [authenticate] },
    async (request) => {
      const u = request.user;
      return {
        id: u.id,
        steamId: u.steamId,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        status: u.status,
        role: u.role,
        phone: u.phoneE164,
      };
    },
  );

  app.post("/auth/logout", async (request, reply) => {
    request.session.delete();
    return reply.send({ ok: true });
  });
};
