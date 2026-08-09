import { describe, expect, it } from "vitest";
import {
  computeGameState,
  computeStreak,
  levelFromXp,
  xpAtLevel,
  xpForEvent,
} from "@/lib/gamification";

describe("levelFromXp", () => {
  it("starts at level 1 with 0 xp", () => {
    expect(levelFromXp(0)).toEqual({
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: 100,
    });
  });

  it("levels up after crossing the 100*xp thresholds", () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(300).level).toBe(3); // 100 + 200 = 300
    expect(levelFromXp(301).level).toBe(3);
    expect(levelFromXp(600).level).toBe(4); // 100 + 200 + 300 = 600
  });

  it("tracks progress into the current level", () => {
    const { xpIntoLevel, xpForNextLevel } = levelFromXp(150);
    expect(xpIntoLevel).toBe(50);
    expect(xpForNextLevel).toBe(200);
  });
});

describe("xpAtLevel", () => {
  it("accumulates 100 + 200 + 300 across the first four levels", () => {
    expect(xpAtLevel(1)).toBe(0);
    expect(xpAtLevel(2)).toBe(100);
    expect(xpAtLevel(3)).toBe(300);
    expect(xpAtLevel(4)).toBe(600);
  });
});

describe("xpForEvent", () => {
  it("gives a value for every known event kind", () => {
    expect(xpForEvent("apply")).toBe(60);
    expect(xpForEvent("resume_rewrite")).toBe(40);
    expect(xpForEvent("agent_run")).toBe(15);
    expect(xpForEvent("application_created")).toBe(30);
    expect(xpForEvent("apply")).toBeGreaterThan(0);
  });
});

describe("computeStreak", () => {
  const now = new Date("2026-08-09T12:00:00Z");

  it("returns 0 with no activity", () => {
    expect(computeStreak(new Set(), now)).toBe(0);
  });

  it("counts consecutive days back from today", () => {
    const days = new Set(["2026-08-07", "2026-08-08", "2026-08-09"]);
    expect(computeStreak(days, now)).toBe(3);
  });

  it("survives a missed today if yesterday was active", () => {
    const days = new Set(["2026-08-06", "2026-08-07", "2026-08-08"]);
    expect(computeStreak(days, now)).toBe(3);
  });

  it("resets when the most recent activity is older than yesterday", () => {
    const days = new Set(["2026-08-05", "2026-08-06"]);
    expect(computeStreak(days, now)).toBe(0);
  });

  it("ignores gaps inside the streak window", () => {
    const days = new Set(["2026-08-09", "2026-08-06"]);
    expect(computeStreak(days, now)).toBe(1);
  });
});

describe("computeGameState", () => {
  it("rewards onboarding and resume upload bonuses", () => {
    const state = computeGameState({
      events: [],
      resumeUploaded: true,
      onboardingCompleted: true,
      applicationStatuses: [],
    });
    expect(state.xp).toBe(150); // 100 resume + 50 onboarding
    expect(state.badges.map((b) => b.id)).toContain("onboarded");
    expect(state.badges.map((b) => b.id)).toContain("resume");
  });

  it("awards apply xp and the first-apply badge", () => {
    const state = computeGameState({
      events: [{ kind: "apply", at: "2026-08-09T10:00:00Z" }],
      resumeUploaded: false,
      onboardingCompleted: true,
      applicationStatuses: [],
    });
    expect(state.xp).toBe(50 + 60 + 50); // onboarding + apply + first apply bonus
    expect(state.badges.map((b) => b.id)).toContain("first_apply");
  });

  it("computes a streak from event days", () => {
    const state = computeGameState({
      events: [
        { kind: "apply", at: "2026-08-07T10:00:00Z" },
        { kind: "agent_run", at: "2026-08-08T10:00:00Z" },
        { kind: "resume_rewrite", at: "2026-08-09T10:00:00Z" },
      ],
      resumeUploaded: true,
      onboardingCompleted: false,
      applicationStatuses: [],
      now: new Date("2026-08-09T12:00:00Z"),
    });
    expect(state.streakDays).toBe(3);
    expect(state.badges.map((b) => b.id)).toContain("streak_3");
  });

  it("awards interview and offer bonuses from pipeline status", () => {
    const state = computeGameState({
      events: [],
      resumeUploaded: true,
      onboardingCompleted: true,
      applicationStatuses: ["interviewing", "offer"],
    });
    expect(state.xp).toBe(150 + 100 + 200);
    expect(state.badges.map((b) => b.id)).toEqual(
      expect.arrayContaining(["interview", "offer"]),
    );
  });

  it("levels up the user as xp accumulates", () => {
    const state = computeGameState({
      events: Array.from({ length: 20 }, () => ({
        kind: "apply" as const,
        at: "2026-08-09T10:00:00Z",
      })),
      resumeUploaded: true,
      onboardingCompleted: true,
      applicationStatuses: [],
    });
    expect(state.level).toBeGreaterThan(1);
  });
});
