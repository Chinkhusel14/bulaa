import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  averageTier,
  entryDenial,
  nextFreeSeat,
  nextHost,
  planJoin,
  planLeave,
  tierForMmr,
  type SeatedMember,
} from "./rules";

function seat(userId: string, seatNo: number, seatedAt: string): SeatedMember {
  return { userId, seat: seatNo, seatedAt: new Date(seatedAt) };
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
  it("uses the host tier when nobody is seated", () => {
    assert.deepEqual(averageTier(1850, []), { label: "1-1", band: "mid" });
  });

  it("maps the mean seated MMR and ignores the unseated host", () => {
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
  const funded = { balanceMnt: 55_000, membership: null };

  it("allows active and restricted callers holding 55,000 MNT", () => {
    assert.equal(entryDenial({ status: "active", ...funded }), null);
    assert.equal(entryDenial({ status: "restricted", ...funded }), null);
  });

  it("rejects banned and pending_phone callers", () => {
    assert.equal(entryDenial({ status: "banned", ...funded }), "banned");
    assert.equal(
      entryDenial({ status: "pending_phone", ...funded }),
      "phone_required",
    );
  });

  it("rejects a caller already hosting or seated", () => {
    assert.equal(
      entryDenial({
        status: "active",
        balanceMnt: 55_000,
        membership: { lobbyId: "l1", role: "host" },
      }),
      "already_in_lobby",
    );
  });

  it("rejects a balance under 55,000 MNT", () => {
    assert.equal(
      entryDenial({ status: "active", balanceMnt: 54_999, membership: null }),
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
  it("picks the earliest seated, then the lowest seat", () => {
    const members = [
      seat("late", 0, "2026-09-27T10:05:00Z"),
      seat("tieHigh", 4, "2026-09-27T10:00:00Z"),
      seat("tieLow", 2, "2026-09-27T10:00:00Z"),
    ];
    assert.equal(nextHost(members)?.userId, "tieLow");
  });

  it("returns null for an empty lobby", () => {
    assert.equal(nextHost([]), null);
  });
});

describe("planLeave", () => {
  const members = [
    seat("a", 0, "2026-09-27T10:00:00Z"),
    seat("b", 1, "2026-09-27T10:01:00Z"),
  ];

  it("rejects a caller who is neither host nor seated", () => {
    assert.deepEqual(planLeave("host", members, "stranger"), {
      kind: "not_in_lobby",
    });
  });

  it("only frees the seat when a non-host member leaves", () => {
    assert.deepEqual(planLeave("host", members, "b"), { kind: "free_seat" });
  });

  it("hands host to the longest-seated member when an unseated host leaves", () => {
    assert.deepEqual(planLeave("host", members, "host"), {
      kind: "transfer_host",
      hostUserId: "a",
    });
  });

  it("hands host to someone else when a seated host leaves", () => {
    assert.deepEqual(planLeave("a", members, "a"), {
      kind: "transfer_host",
      hostUserId: "b",
    });
  });

  it("cancels when the host leaves an empty lobby", () => {
    assert.deepEqual(planLeave("host", [], "host"), { kind: "cancel" });
  });

  it("cancels when a seated host was the last member", () => {
    assert.deepEqual(planLeave("a", [members[0]!], "a"), { kind: "cancel" });
  });
});
