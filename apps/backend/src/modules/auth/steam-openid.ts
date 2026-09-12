const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

export function buildSteamRedirectUrl(realm: string, returnUrl: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": realm,
    "openid.identity":
      "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id":
      "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamCallback(
  query: Record<string, string>,
): Promise<string | null> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, value);
  }
  params.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const body = await res.text();
  if (!body.includes("is_valid:true")) return null;

  const claimedId = query["openid.claimed_id"] ?? "";
  const match = claimedId.match(
    /^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/,
  );
  return match?.[1] ?? null;
}
