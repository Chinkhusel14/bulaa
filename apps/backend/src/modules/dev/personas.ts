import { users, walletAccounts, type Database } from "@bulaa/db";
import { eq, like } from "drizzle-orm";

export const DEV_STEAM_PREFIX = "dev:";

export const DEV_WALLET_MNT = 500_000;

export type DevPersonaSpec = {
  label: string;
  displayName: string;
  mmr: number;
  phoneE164: string;
};

/** Fixed local personas: `player-1` … `player-10`, steam id `dev:player-N`. */
export const DEV_PERSONA_SPECS: DevPersonaSpec[] = [
  { label: "player-1", displayName: "Dev Player 1", mmr: 2200, phoneE164: "+99920000001" },
  { label: "player-2", displayName: "Dev Player 2", mmr: 2000, phoneE164: "+99920000002" },
  { label: "player-3", displayName: "Dev Player 3", mmr: 1850, phoneE164: "+99920000003" },
  { label: "player-4", displayName: "Dev Player 4", mmr: 1750, phoneE164: "+99920000004" },
  { label: "player-5", displayName: "Dev Player 5", mmr: 1650, phoneE164: "+99920000005" },
  { label: "player-6", displayName: "Dev Player 6", mmr: 1550, phoneE164: "+99920000006" },
  { label: "player-7", displayName: "Dev Player 7", mmr: 1450, phoneE164: "+99920000007" },
  { label: "player-8", displayName: "Dev Player 8", mmr: 1350, phoneE164: "+99920000008" },
  { label: "player-9", displayName: "Dev Player 9", mmr: 1250, phoneE164: "+99920000009" },
  { label: "player-10", displayName: "Dev Player 10", mmr: 1150, phoneE164: "+99920000010" },
];

export function devSteamId(label: string): string {
  return `${DEV_STEAM_PREFIX}${label}`;
}

export function devLabelFromSteamId(steamId: string): string | null {
  if (!steamId.startsWith(DEV_STEAM_PREFIX)) return null;
  return steamId.slice(DEV_STEAM_PREFIX.length);
}

export async function ensureDevPersonas(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    for (const spec of DEV_PERSONA_SPECS) {
      const steamId = devSteamId(spec.label);
      const [existing] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.steamId, steamId))
        .limit(1);

      let userId: string;
      if (existing) {
        userId = existing.id;
        await tx
          .update(users)
          .set({
            displayName: spec.displayName,
            mmr: spec.mmr,
            phoneE164: spec.phoneE164,
            phoneVerifiedAt: new Date(),
            status: "active",
          })
          .where(eq(users.id, userId));
      } else {
        const [created] = await tx
          .insert(users)
          .values({
            steamId,
            displayName: spec.displayName,
            mmr: spec.mmr,
            phoneE164: spec.phoneE164,
            phoneVerifiedAt: new Date(),
            status: "active",
          })
          .returning({ id: users.id });
        if (!created) throw new Error(`Dev persona insert failed: ${spec.label}`);
        userId = created.id;
        await tx.insert(walletAccounts).values({
          userId,
          balanceMnt: DEV_WALLET_MNT,
        });
      }

      const [wallet] = await tx
        .select({ id: walletAccounts.id })
        .from(walletAccounts)
        .where(eq(walletAccounts.userId, userId))
        .limit(1);
      if (!wallet) {
        await tx.insert(walletAccounts).values({ userId, balanceMnt: DEV_WALLET_MNT });
      } else {
        await tx
          .update(walletAccounts)
          .set({ balanceMnt: DEV_WALLET_MNT })
          .where(eq(walletAccounts.userId, userId));
      }
    }
  });
}

export type DevPersonaRow = {
  label: string;
  userId: string;
  displayName: string;
  mmr: number;
  balanceMnt: number;
  status: string;
};

export async function listDevPersonas(db: Database): Promise<DevPersonaRow[]> {
  const rows = await db
    .select({
      userId: users.id,
      steamId: users.steamId,
      displayName: users.displayName,
      mmr: users.mmr,
      status: users.status,
      balanceMnt: walletAccounts.balanceMnt,
    })
    .from(users)
    .leftJoin(walletAccounts, eq(walletAccounts.userId, users.id))
    .where(like(users.steamId, `${DEV_STEAM_PREFIX}%`))
    .orderBy(users.steamId);

  const mapped = rows.flatMap((row) => {
    const label = devLabelFromSteamId(row.steamId);
    if (!label) return [];
    return [
      {
        label,
        userId: row.userId,
        displayName: row.displayName,
        mmr: row.mmr,
        balanceMnt: row.balanceMnt ?? 0,
        status: row.status,
      },
    ];
  });

  return mapped.sort((a, b) => {
    const na = Number(a.label.replace("player-", ""));
    const nb = Number(b.label.replace("player-", ""));
    return na - nb;
  });
}

export async function resolveDevUserId(
  db: Database,
  input: { userId?: string; label?: string },
): Promise<string | null> {
  if (input.userId) {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    return row?.id ?? null;
  }
  if (input.label) {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.steamId, devSteamId(input.label)))
      .limit(1);
    return row?.id ?? null;
  }
  return null;
}
