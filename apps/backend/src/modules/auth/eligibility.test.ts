import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkEligibility } from "./eligibility";
import type { SteamSnapshot } from "@bulaa/shared";

const config = { minAccountAgeDays: 90, minCs2Hours: 100 };

function makeSnapshot(overrides: Partial<SteamSnapshot> = {}): SteamSnapshot {
  return {
    steamId: "76561198000000000",
    displayName: "Test",
    avatarUrl: "https://example.com/av.jpg",
    steamCreatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    cs2Minutes: 200 * 60,
    vacBanned: false,
    gameBanned: false,
    ...overrides,
  };
}

describe("checkEligibility", () => {
  it("passes a clean account", () => {
    const result = checkEligibility(makeSnapshot(), config);
    assert.equal(result.ok, true);
  });

  it("rejects VAC banned", () => {
    const result = checkEligibility(makeSnapshot({ vacBanned: true }), config);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "vac_banned");
  });

  it("rejects game banned", () => {
    const result = checkEligibility(makeSnapshot({ gameBanned: true }), config);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "game_banned");
  });

  it("rejects private profile (no steamCreatedAt)", () => {
    const result = checkEligibility(
      makeSnapshot({ steamCreatedAt: undefined as unknown as Date }),
      config,
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "steam_profile_private");
  });

  it("rejects account too new", () => {
    const result = checkEligibility(
      makeSnapshot({ steamCreatedAt: new Date() }),
      config,
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "account_too_new");
  });

  it("rejects too few CS2 hours", () => {
    const result = checkEligibility(
      makeSnapshot({ cs2Minutes: 10 * 60 }),
      config,
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "cs2_hours_too_low");
  });
});
