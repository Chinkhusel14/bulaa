import type { SteamSnapshot } from "@bulaa/shared";

const STEAM_API = "https://api.steampowered.com";
const CS2_APP_ID = 730;

interface RawBan {
  VACBanned: boolean;
  NumberOfGameBans: number;
}

interface RawPlayer {
  personaname: string;
  avatarfull: string;
  timecreated?: number;
}

interface RawGame {
  appid: number;
  playtime_forever: number;
}

export async function fetchSteamSnapshot(
  steamId: string,
  apiKey: string,
): Promise<SteamSnapshot | null> {
  const [bansRes, summaryRes, gamesRes] = await Promise.all([
    fetch(
      `${STEAM_API}/ISteamUser/GetPlayerBans/v1/?key=${apiKey}&steamids=${steamId}`,
    ),
    fetch(
      `${STEAM_API}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`,
    ),
    fetch(
      `${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=false&include_played_free_games=true&appids_filter[0]=${CS2_APP_ID}`,
    ),
  ]);

  if (!bansRes.ok || !summaryRes.ok || !gamesRes.ok) return null;

  const bansData = (await bansRes.json()) as { players: RawBan[] };
  const summaryData = (await summaryRes.json()) as {
    response: { players: RawPlayer[] };
  };
  const gamesData = (await gamesRes.json()) as {
    response: { games?: RawGame[] };
  };

  const ban = bansData.players[0];
  const player = summaryData.response.players[0];
  if (!ban || !player) return null;

  const cs2Game = gamesData.response.games?.find(
    (g) => g.appid === CS2_APP_ID,
  );

  return {
    steamId,
    displayName: player.personaname,
    avatarUrl: player.avatarfull,
    steamCreatedAt: player.timecreated
      ? new Date(player.timecreated * 1000)
      : undefined as unknown as Date,
    cs2Minutes: cs2Game?.playtime_forever ?? 0,
    vacBanned: ban.VACBanned,
    gameBanned: ban.NumberOfGameBans > 0,
  };
}
