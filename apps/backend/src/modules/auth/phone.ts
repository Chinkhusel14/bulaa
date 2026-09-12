import { createHmac, randomInt } from "node:crypto";
import type Redis from "ioredis";

const OTP_TTL = 300;
const SEND_COOLDOWN = 60;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

function hashOtp(code: string, pepper: string): string {
  return createHmac("sha256", pepper).update(code).digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export async function canSendOtp(
  redis: Redis,
  phone: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const cooldownKey = `otp:send:${phone}`;
  const hourlyKey = `otp:hourly:${phone}`;

  const cooldown = await redis.exists(cooldownKey);
  if (cooldown) return { allowed: false, reason: "otp_rate_limited" };

  const hourlyCount = await redis.get(hourlyKey);
  if (hourlyCount && parseInt(hourlyCount, 10) >= MAX_SENDS_PER_HOUR) {
    return { allowed: false, reason: "otp_rate_limited" };
  }

  return { allowed: true };
}

export async function storeOtp(
  redis: Redis,
  phone: string,
  code: string,
  pepper: string,
): Promise<void> {
  const hash = hashOtp(code, pepper);
  const key = `otp:${phone}`;
  const cooldownKey = `otp:send:${phone}`;
  const hourlyKey = `otp:hourly:${phone}`;

  const pipeline = redis.pipeline();
  pipeline.hset(key, { hash, attempts: "0", createdAt: Date.now().toString() });
  pipeline.expire(key, OTP_TTL);
  pipeline.set(cooldownKey, "1", "EX", SEND_COOLDOWN);
  pipeline.incr(hourlyKey);
  pipeline.expire(hourlyKey, 3600);
  await pipeline.exec();
}

export async function verifyOtp(
  redis: Redis,
  phone: string,
  code: string,
  pepper: string,
): Promise<{ valid: boolean; reason?: string }> {
  const key = `otp:${phone}`;
  const record = await redis.hgetall(key);

  if (!record.hash) return { valid: false, reason: "otp_expired" };

  const attempts = parseInt(record.attempts ?? "0", 10);
  if (attempts >= MAX_VERIFY_ATTEMPTS) {
    return { valid: false, reason: "otp_locked" };
  }

  await redis.hincrby(key, "attempts", 1);

  const hash = hashOtp(code, pepper);
  if (hash !== record.hash) {
    return { valid: false, reason: "otp_invalid" };
  }

  await redis.del(key);
  return { valid: true };
}
