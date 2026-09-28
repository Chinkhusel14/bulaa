import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  lobbyCostMnt,
  prizePoolMntSchema,
  prizeShareMnt,
  winnerPayoutMnt,
} from "@bulaa/shared";
import {
  averageTier,
  entryDenial,
  nextFreeSeat,
  nextHost,
  planJoin,
  planLeave,
  tierForMmr,
  type LobbyMember,
} from "./rules";

function member(userId: string, seatNo: number, joinedAt: string): LobbyMember {
  return { userId, seat: seatNo, joinedAt: new Date(joinedAt) };
}

describe("tierForMmr", () => {
  it("maps each band threshold to its label and accent", () => {
    assert.deepEqual(tierForMmr(2200), { label: "Pro", band: "pro" });
    assert.deepEqual(tierForMmr(2199), { label: "Semi-Pro", band: "pro" });
    assert.deepEqual(tierForMmr(1800), { label: "1-1", band: "mid" });
    assert.deepEqual(tierForMmr(1799), { label: "1-2", band: "mid" });
    assert.deepEqual(tierForMmr(1600), { label: "1-3", band: "mid" });
    assert.deepEqual(tierForMmr(1599), { label: "2-1", band: "low" });
    assert.deepEqual(tierForMmr(1000), { label: "3-3", band: "low" });
  });

  it("keeps 3-3 below 1000 and Pro above 2200", () => {
    assert.deepEqual(tierForMmr(400), { label: "3-3", band: "low" });
    assert.deepEqual(tierForMmr(3000), { label: "Pro", band: "pro" });
  });
});

describe("averageTier", () => {
  it("falls back to the host tier when the lobby has no members", () => {
    assert.deepEqual(averageTier(1850, []), { label: "1-1", band: "mid" });
  });

  it("maps the mean member MMR", () => {
    assert.deepEqual(averageTier(2400, [2200, 1800]), {
      label: "Semi-Pro",
      band: "pro",
    });
    assert.deepEqual(averageTier(2400, [1000, 1399]), {
      label: "3-2",
      band: "low",
    });
  });
});

describe("prize pool money", () => {
  it("splits the pool into ten shares and five winner payouts", () => {
    assert.equal(prizeShareMnt(500_000), 50_000);
    assert.equal(winnerPayoutMnt(500_000), 100_000);
    assert.equal(lobbyCostMnt(30_000, 5_000), 8_000);
  });

  it("accepts 30,000 to 500,000 MNT in whole shares only", () => {
    assert.equal(prizePoolMntSchema.safeParse(30_000).success, true);
    assert.equal(prizePoolMntSchema.safeParse(500_000).success, true);
    assert.equal(prizePoolMntSchema.safeParse(29_990).success, false);
    assert.equal(prizePoolMntSchema.safeParse(500_010).success, false);
    assert.equal(prizePoolMntSchema.safeParse(30_005).success, false);
  });
});

describe("nextFreeSeat", () => {
  it("returns the lowest free seat", () => {
    assert.equal(nextFreeSeat([]), 0);
    assert.equal(nextFreeSeat([0, 1, 3]), 2);
    assert.equal(nextFreeSeat([0, 1, 2, 3, 4, 5, 6, 7, 8]), 9);
  });

  it("returns null when all ten seats are taken", () => {
    assert.equal(nextFreeSeat([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]), null);
  });
});

describe("entryDenial", () => {
  const funded = { balanceMnt: 55_000, costMnt: 55_000, membership: null };

  it("allows active and restricted callers who cover the cost", () => {
    assert.equal(entryDenial({ status: "active", ...funded }), null);
    assert.equal(entryDenial({ status: "restricted", ...funded }), null);
  });

  it("rejects banned and pending_phone callers", () => {
    assert.equal(entryDenial({ status: "banned", ...funded }), "banned");
    assert.equal(entryDenial({ status: "pending_phone", ...funded }), "phone_required");
  });

  it("rejects a caller already in a lobby", () => {
    assert.equal(
      entryDenial({
        ...funded,
        status: "active",
        membership: { lobbyId: "l1", role: "host" },
      }),
      "already_in_lobby",
    );
  });

  it("rejects a balance under the lobby cost", () => {
    assert.equal(
      entryDenial({ ...funded, status: "active", balanceMnt: 54_999 }),
      "insufficient_balance",
    );
  });
});

describe("planJoin", () => {
  it("assigns the lowest free seat in an open lobby", () => {
    assert.deepEqual(planJoin("open", [0, 2]), { ok: true, seat: 1 });
  });

  it("rejects a lobby that is not open", () => {
    assert.deepEqual(planJoin("cancelled", []), {
      ok: false,
      code: "lobby_closed",
    });
  });

  it("rejects a full lobby", () => {
    assert.deepEqual(planJoin("open", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), {
      ok: false,
      code: "lobby_full",
    });
  });
});

describe("nextHost", () => {
  it("picks the earliest joined, then the lowest seat", () => {
    const members = [
      member("late", 0, "2026-09-27T10:05:00Z"),
      member("tieHigh", 4, "2026-09-27T10:00:00Z"),
      member("tieLow", 2, "2026-09-27T10:00:00Z"),
    ];
    assert.equal(nextHost(members)?.userId, "tieLow");
  });

  it("returns null for an empty lobby", () => {
    assert.equal(nextHost([]), null);
  });
});

describe("planLeave", () => {
  const members = [
    member("a", 0, "2026-09-27T10:00:00Z"),
    member("b", 1, "2026-09-27T10:01:00Z"),
  ];

  it("rejects a caller who is neither host nor member", () => {
    assert.deepEqual(planLeave("host", members, "stranger"), {
      kind: "not_in_lobby",
    });
  });

  it("only frees the seat when a non-host member leaves", () => {
    assert.deepEqual(planLeave("a", members, "b"), { kind: "free_seat" });
  });

  it("hands host to the longest-joined remaining member", () => {
    assert.deepEqual(planLeave("a", members, "a"), {
      kind: "transfer_host",
      hostUserId: "b",
    });
  });

  it("cancels when the host was the last member", () => {
    assert.deepEqual(planLeave("a", [members[0]!], "a"), { kind: "cancel" });
  });
});
