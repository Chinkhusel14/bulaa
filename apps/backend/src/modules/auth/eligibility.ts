import type { AuthErrorCode, SteamSnapshot, EligibilityResult } from "@bulaa/shared";

interface EligibilityConfig {
  minAccountAgeDays: number;
  minCs2Hours: number;
}

export function checkEligibility(
  snapshot: SteamSnapshot,
  config: EligibilityConfig,
): EligibilityResult {
  if (snapshot.vacBanned) return { ok: false, code: "vac_banned" };
  if (snapshot.gameBanned) return { ok: false, code: "game_banned" };

  if (!snapshot.steamCreatedAt) {
    return { ok: false, code: "steam_profile_private" };
  }

  const ageDays =
    (Date.now() - snapshot.steamCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < config.minAccountAgeDays) {
    return { ok: false, code: "account_too_new" };
  }

  const cs2Hours = snapshot.cs2Minutes / 60;
  if (cs2Hours < config.minCs2Hours) {
    if (snapshot.cs2Minutes === 0 && !snapshot.steamCreatedAt) {
      return { ok: false, code: "steam_profile_private" };
    }
    return { ok: false, code: "cs2_hours_too_low" };
  }

  return { ok: true, snapshot };
}
