import { z } from "zod";

export const steamIdSchema = z
  .string()
  .regex(/^7656119\d{10}$/, "Invalid SteamID64");

export const moneyMntSchema = z
  .number()
  .int()
  .nonnegative()
  .describe("Amount in MNT tögrög (integer)");

export const queuePartySizeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const matchScoreSchema = z.object({
  teamA: z.number().int().min(0).max(16),
  teamB: z.number().int().min(0).max(16),
});

export type SteamId = z.infer<typeof steamIdSchema>;
export type MoneyMnt = z.infer<typeof moneyMntSchema>;
export type QueuePartySize = z.infer<typeof queuePartySizeSchema>;
export type MatchScore = z.infer<typeof matchScoreSchema>;
