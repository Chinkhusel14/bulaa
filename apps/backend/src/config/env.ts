import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3101),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:3100"),

  STEAM_WEB_API_KEY: z.string().min(1).optional(),
  STEAM_REALM: z.string().default("http://localhost:3101"),
  STEAM_RETURN_URL: z
    .string()
    .default("http://localhost:3101/api/auth/steam/callback"),
  SESSION_SECRET: z.string().min(32),
  FRONT_URL: z.string().default("http://localhost:3100"),

  SMS_PROVIDER: z.enum(["console", "callpro"]).default("console"),
  CALLPRO_API_KEY: z.string().optional(),
  CALLPRO_FROM: z.string().optional(),
  CALLPRO_ENDPOINT: z
    .string()
    .default("https://api-text.callpro.mn/v1/sms/send"),

  AUTH_MIN_ACCOUNT_AGE_DAYS: z.coerce.number().int().default(90),
  AUTH_MIN_CS2_HOURS: z.coerce.number().int().default(100),
  OTP_PEPPER: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(raw);
}
