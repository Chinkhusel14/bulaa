import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { devLabelFromSteamId, devSteamId } from "./personas";

describe("dev persona ids", () => {
  it("maps labels to steam ids and back", () => {
    assert.equal(devSteamId("player-3"), "dev:player-3");
    assert.equal(devLabelFromSteamId("dev:player-3"), "player-3");
    assert.equal(devLabelFromSteamId("76561198000000000"), null);
  });
});
