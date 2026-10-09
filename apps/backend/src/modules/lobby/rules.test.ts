import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  lobbyCostMnt,
  prizePoolMntSchema,
  prizeShareMnt,
  winnerPayoutMnt,
  type Side,
} from "@bulaa/shared";
import {
  averageTier,
  canOpenAccept,
  captains,
  entryDenial,
  nextHost,
  planAccept,
  planJoin,
  planLeave,
  planMove,
  planPlacement,
  planVeto,
  tierForMmr,
  rejoinBlockActive,
  voteThreshold,
  type LobbyMember,
} from "./rules";

function member(
  userId: string,
  side: Side,
  slot: number,
  joinedAt: string,
  ready = false,
  accepted = false,
): LobbyMember {
  return {
    userId,
    side,
    slot,
    joinedAt: new Date(joinedAt),
    ready,
    accepted,
  };
}

function tenReady(): LobbyMember[] {
  return [
    member("a0", "a", 0, "2026-10-02T10:00:00Z", true),
    member("a1", "a", 1, "2026-10-02T10:00:01Z", true),
    member("a2", "a", 2, "2026-10-02T10:00:02Z", true),
    member("a3", "a", 3, "2026-10-02T10:00:03Z", true),
    member("a4", "a", 4, "2026-10-02T10:00:04Z", true),
    member("b0", "b", 0, "2026-10-02T10:00:05Z", true),
    member("b1", "b", 1, "2026-10-02T10:00:06Z", true),
    member("b2", "b", 2, "2026-10-02T10:00:07Z", true),
    member("b3", "b", 3, "2026-10-02T10:00:08Z", true),
    member("b4", "b", 4, "2026-10-02T10:00:09Z", true),
  ];
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
  it("treats prize pool as each winner payout and splits entry across ten players", () => {
    assert.equal(winnerPayoutMnt(50_000), 50_000);
    assert.equal(prizeShareMnt(50_000), 25_000);
    assert.equal(lobbyCostMnt(30_000, 5_000), 20_000);
    assert.equal(lobbyCostMnt(50_000, 5_000), 30_000);
  });

  it("accepts 30,000 to 500,000 MNT per winner in multiples of 10", () => {
    assert.equal(prizePoolMntSchema.safeParse(30_000).success, true);
    assert.equal(prizePoolMntSchema.safeParse(500_000).success, true);
    assert.equal(prizePoolMntSchema.safeParse(29_990).success, false);
    assert.equal(prizePoolMntSchema.safeParse(500_010).success, false);
    assert.equal(prizePoolMntSchema.safeParse(30_005).success, false);
  });
});

describe("planPlacement", () => {
  it("puts the first joiner on Team A slot 0", () => {
    assert.deepEqual(planPlacement([]), { ok: true, side: "a", slot: 0 });
  });

  it("joins the side with fewer players and uses that side's count as the slot", () => {
    const members = [
      member("a0", "a", 0, "2026-10-02T10:00:00Z"),
      member("a1", "a", 1, "2026-10-02T10:00:01Z"),
      member("b0", "b", 0, "2026-10-02T10:00:02Z"),
    ];
    assert.deepEqual(planPlacement(members), { ok: true, side: "b", slot: 1 });
  });

  it("breaks a tie toward Team A", () => {
    const members = [
      member("a0", "a", 0, "2026-10-02T10:00:00Z"),
      member("b0", "b", 0, "2026-10-02T10:00:01Z"),
    ];
    assert.deepEqual(planPlacement(members), { ok: true, side: "a", slot: 1 });
  });

  it("returns lobby_full at 10 players", () => {
    assert.deepEqual(planPlacement(tenReady()), { ok: false, code: "lobby_full" });
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
  it("assigns the smaller side in an open lobby", () => {
    const members = [member("a0", "a", 0, "2026-10-02T10:00:00Z")];
    assert.deepEqual(planJoin("open", members), { ok: true, side: "b", slot: 0 });
  });

  it("rejects a lobby that is not open", () => {
    assert.deepEqual(planJoin("cancelled", []), {
      ok: false,
      code: "lobby_closed",
    });
  });

  it("rejects a full lobby", () => {
    assert.deepEqual(planJoin("open", tenReady()), {
      ok: false,
      code: "lobby_full",
    });
  });
});

describe("planMove", () => {
  it("appends the player to the other side and packs the side they left", () => {
    const members = [
      member("a0", "a", 0, "2026-10-02T10:00:00Z"),
      member("a1", "a", 1, "2026-10-02T10:00:01Z"),
      member("a2", "a", 2, "2026-10-02T10:00:02Z"),
      member("b0", "b", 0, "2026-10-02T10:00:03Z"),
    ];
    const plan = planMove(members, "a1", "b");
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.deepEqual(
      plan.members.map((m) => ({ userId: m.userId, side: m.side, slot: m.slot })),
      [
        { userId: "a0", side: "a", slot: 0 },
        { userId: "a2", side: "a", slot: 1 },
        { userId: "b0", side: "b", slot: 0 },
        { userId: "a1", side: "b", slot: 1 },
      ],
    );
  });

  it("rejects a move onto a full side", () => {
    const members = [
      ...["a0", "a1", "a2", "a3", "a4"].map((id, slot) =>
        member(id, "a", slot, `2026-10-02T10:00:0${slot}Z`),
      ),
      member("b0", "b", 0, "2026-10-02T10:00:05Z"),
    ];
    assert.deepEqual(planMove(members, "b0", "a"), { ok: false, code: "side_full" });
  });

  it("rejects a move onto the player's current side", () => {
    const members = [member("a0", "a", 0, "2026-10-02T10:00:00Z")];
    assert.deepEqual(planMove(members, "a0", "a"), { ok: false, code: "same_side" });
  });
});

describe("nextHost", () => {
  it("picks the earliest joined, then the lowest slot, then userId", () => {
    const members = [
      member("late", "a", 0, "2026-09-27T10:05:00Z"),
      member("tieHigh", "b", 1, "2026-09-27T10:00:00Z"),
      member("tieLow", "b", 0, "2026-09-27T10:00:00Z"),
    ];
    assert.equal(nextHost(members)?.userId, "tieLow");
  });

  it("returns null for an empty lobby", () => {
    assert.equal(nextHost([]), null);
  });
});

describe("captains", () => {
  it("picks the earliest joined on each side, then lowest slot, then userId", () => {
    const members = [
      member("aLate", "a", 0, "2026-10-02T10:01:00Z"),
      member("aTieZ", "a", 2, "2026-10-02T10:00:00Z"),
      member("aTieA", "a", 1, "2026-10-02T10:00:00Z"),
      member("bOnly", "b", 0, "2026-10-02T10:02:00Z"),
    ];
    assert.deepEqual(captains(members), { a: "aTieA", b: "bOnly" });
  });
});

describe("planLeave", () => {
  const members = [
    member("a", "a", 0, "2026-09-27T10:00:00Z"),
    member("b", "b", 0, "2026-09-27T10:01:00Z"),
  ];

  it("rejects a caller who is neither host nor member", () => {
    assert.deepEqual(planLeave("host", members, "stranger"), {
      kind: "not_in_lobby",
    });
  });

  it("only removes the member when a non-host leaves", () => {
    assert.deepEqual(planLeave("a", members, "b"), { kind: "free_seat" });
  });

  it("hands host to the member who joined earliest among those who remain", () => {
    assert.deepEqual(planLeave("a", members, "a"), {
      kind: "transfer_host",
      hostUserId: "b",
    });
  });

  it("cancels when the host was the last member", () => {
    assert.deepEqual(planLeave("a", [members[0]!], "a"), { kind: "cancel" });
  });
});

describe("canOpenAccept", () => {
  it("is true only at 5v5 with every member ready", () => {
    assert.equal(canOpenAccept(tenReady()), true);
    const nine = tenReady().slice(0, 9);
    assert.equal(canOpenAccept(nine), false);
    const unreadied = tenReady().map((m, i) => (i === 0 ? { ...m, ready: false } : m));
    assert.equal(canOpenAccept(unreadied), false);
  });
});

describe("planAccept", () => {
  it("opens the accept window when all 10 are ready at 5v5", () => {
    const plan = planAccept("open", tenReady(), { kind: "all_ready" });
    assert.deepEqual(
      {
        ok: plan.ok,
        status: plan.ok ? plan.status : null,
        phaseDeadline: plan.ok ? plan.phaseDeadline : null,
        accepted: plan.ok ? plan.members.every((m) => m.accepted === false) : false,
      },
      { ok: true, status: "accepting", phaseDeadline: "accept", accepted: true },
    );
  });

  it("moves to veto when every member has accepted", () => {
    let members = tenReady();
    for (const m of members) {
      const plan = planAccept("accepting", members, { kind: "accepted", userId: m.userId });
      assert.equal(plan.ok, true);
      if (!plan.ok) return;
      members = plan.members;
      if (m.userId !== "b4") {
        assert.deepEqual(
          { status: plan.status, phaseDeadline: plan.phaseDeadline },
          { status: "accepting", phaseDeadline: "keep" },
        );
      } else {
        assert.deepEqual(
          { status: plan.status, phaseDeadline: plan.phaseDeadline, vetoStep: plan.vetoStep },
          { status: "veto", phaseDeadline: "veto", vetoStep: 0 },
        );
      }
    }
  });

  it("decline unreadies the decliner and anyone who has not accepted", () => {
    const members = tenReady().map((m, i) => (i < 3 ? { ...m, accepted: true } : m));
    const plan = planAccept("accepting", members, { kind: "declined", userId: "a0" });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.status, "open");
    assert.equal(plan.phaseDeadline, null);
    assert.deepEqual(
      plan.members.map((m) => ({ userId: m.userId, ready: m.ready, accepted: m.accepted })),
      [
        { userId: "a0", ready: false, accepted: false },
        { userId: "a1", ready: true, accepted: false },
        { userId: "a2", ready: true, accepted: false },
        { userId: "a3", ready: false, accepted: false },
        { userId: "a4", ready: false, accepted: false },
        { userId: "b0", ready: false, accepted: false },
        { userId: "b1", ready: false, accepted: false },
        { userId: "b2", ready: false, accepted: false },
        { userId: "b3", ready: false, accepted: false },
        { userId: "b4", ready: false, accepted: false },
      ],
    );
  });

  it("timeout unreadies only members who have not accepted", () => {
    const members = tenReady().map((m) =>
      m.userId === "a0" || m.userId === "b0" ? { ...m, accepted: true } : m,
    );
    const plan = planAccept("accepting", members, { kind: "timeout" });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.status, "open");
    assert.deepEqual(
      plan.members.filter((m) => m.ready).map((m) => m.userId),
      ["a0", "b0"],
    );
    assert.equal(plan.members.every((m) => m.accepted === false), true);
  });

  it("roster change returns to open without unreadies anyone", () => {
    const members = tenReady().map((m, i) =>
      i === 0 ? { ...m, accepted: true } : { ...m, accepted: false },
    );
    const plan = planAccept("accepting", members, { kind: "roster_changed" });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.status, "open");
    assert.equal(plan.phaseDeadline, null);
    assert.equal(plan.members.every((m) => m.ready), true);
    assert.equal(plan.members.every((m) => m.accepted === false), true);
  });
});

describe("planVeto", () => {
  const rng0 = () => 0;

  it("runs all seven steps and assigns the leftover map as decider", () => {
    const picks = [
      { map: "ancient" as const, actorSide: "a" as const },
      { map: "anubis" as const, actorSide: "b" as const },
      { map: "dust2" as const, actorSide: "a" as const },
      { map: "inferno" as const, actorSide: "b" as const },
      { map: "mirage" as const, actorSide: "a" as const },
      { map: "nuke" as const, actorSide: "b" as const },
    ];
    const used: string[] = [];
    const actions = [];
    let step = 0;
    for (const [i, pick] of picks.entries()) {
      const plan = planVeto(step, used, { kind: "pick", ...pick }, rng0);
      assert.equal(plan.ok, true);
      if (!plan.ok) return;
      actions.push(...plan.actions);
      used.push(...plan.actions.map((a) => a.map));
      step = plan.vetoStep;
      if (i < 5) {
        assert.deepEqual(
          { status: plan.status, phaseDeadline: plan.phaseDeadline, vetoStep: plan.vetoStep },
          { status: "veto", phaseDeadline: "veto", vetoStep: i + 1 },
        );
      } else {
        assert.deepEqual(plan, {
          ok: true,
          actions: [
            { step: 5, map: "nuke", action: "ban", side: "b" },
            { step: 6, map: "train", action: "decider", side: null },
          ],
          vetoStep: 6,
          status: "awaiting_server",
          phaseDeadline: null,
        });
      }
    }
    assert.deepEqual(actions, [
      { step: 0, map: "ancient", action: "ban", side: "a" },
      { step: 1, map: "anubis", action: "ban", side: "b" },
      { step: 2, map: "dust2", action: "pick", side: "a" },
      { step: 3, map: "inferno", action: "pick", side: "b" },
      { step: 4, map: "mirage", action: "ban", side: "a" },
      { step: 5, map: "nuke", action: "ban", side: "b" },
      { step: 6, map: "train", action: "decider", side: null },
    ]);
  });

  it("timeout with rng 0 takes the first remaining map in pool order", () => {
    const plan = planVeto(0, ["ancient", "anubis"], { kind: "timeout" }, rng0);
    assert.deepEqual(plan, {
      ok: true,
      actions: [{ step: 0, map: "dust2", action: "ban", side: "a" }],
      vetoStep: 1,
      status: "veto",
      phaseDeadline: "veto",
    });
  });

  it("timeout on the last captain step also applies the decider", () => {
    const used = ["ancient", "anubis", "dust2", "inferno", "mirage"];
    const plan = planVeto(5, used, { kind: "timeout" }, rng0);
    assert.deepEqual(plan, {
      ok: true,
      actions: [
        { step: 5, map: "nuke", action: "ban", side: "b" },
        { step: 6, map: "train", action: "decider", side: null },
      ],
      vetoStep: 6,
      status: "awaiting_server",
      phaseDeadline: null,
    });
  });

  it("rejects a pick from the other side", () => {
    assert.deepEqual(planVeto(0, [], { kind: "pick", map: "ancient", actorSide: "b" }, rng0), {
      ok: false,
      code: "not_your_turn",
    });
  });

  it("rejects a map that is already used", () => {
    assert.deepEqual(
      planVeto(1, ["ancient"], { kind: "pick", map: "ancient", actorSide: "b" }, rng0),
      { ok: false, code: "map_taken" },
    );
  });
});

describe("voteThreshold", () => {
  it("is 6 for 10 members and 2 for 3 members", () => {
    assert.equal(voteThreshold(10), 6);
    assert.equal(voteThreshold(3), 2);
  });
});

describe("rejoinBlockActive", () => {
  const now = Date.parse("2026-10-10T00:00:00.000Z");

  it("blocks while the window is still open", () => {
    assert.equal(rejoinBlockActive(new Date(now + 60_000), now), true);
  });

  it("allows a join once the window has passed", () => {
    assert.equal(rejoinBlockActive(new Date(now - 1), now), false);
    assert.equal(rejoinBlockActive(null, now), false);
  });
});
