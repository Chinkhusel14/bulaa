import { existsSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const key = process.env.STEAM_WEB_API_KEY;
const steamId = "76561198359271246";
if (!key) {
  console.log("NO_KEY");
  process.exit(1);
}

const STEAM_API = "https://api.steampowered.com";
const CS2 = 730;
const urls = [
  [
    "bans",
    `${STEAM_API}/ISteamUser/GetPlayerBans/v1/?key=${key}&steamids=${steamId}`,
  ],
  [
    "summary",
    `${STEAM_API}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`,
  ],
  [
    "games",
    `${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=false&include_played_free_games=true&appids_filter[0]=${CS2}`,
  ],
];

for (const [name, url] of urls) {
  const res = await fetch(url);
  const text = await res.text();
  let shape = "nonjson";
  try {
    const j = JSON.parse(text);
    if (name === "bans") {
      shape = `players=${Array.isArray(j.players) ? j.players.length : "no"}`;
    }
    if (name === "summary") {
      shape = `players=${j.response?.players?.length ?? "noresp"}`;
    }
    if (name === "games") {
      const keys = Object.keys(j.response || {}).join(",");
      shape = `games=${j.response?.games?.length ?? "noresp_or_empty"} keys=${keys}`;
    }
  } catch {
    shape = "parse_fail";
  }
  console.log(name, `status=${res.status}`, `len=${text.length}`, shape);
}
