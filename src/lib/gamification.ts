// Gamification engine: turns real user activity (usage events, applications,
// agent runs) into XP, levels, streaks, and badges. Pure functions, no I/O.

export interface ActivityEvent {
  kind: "apply" | "resume_rewrite" | "agent_run" | "application_created";
  at: string;
}

export interface BadgeDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export interface GameState {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  streakDays: number;
  badges: BadgeDef[];
  nextBadge: BadgeDef | null;
}

const XP_VALUES: Record<ActivityEvent["kind"], number> = {
  apply: 60,
  resume_rewrite: 40,
  agent_run: 15,
  application_created: 30,
};

const BONUS_XP = {
  resume_uploaded: 100,
  onboarding_completed: 50,
  first_apply: 50,
  interview: 100,
  offer: 200,
} as const;

export const BADGES: BadgeDef[] = [
  { id: "onboarded", label: "First Steps", emoji: "👣", description: "Complete your onboarding." },
  { id: "resume", label: "Resume Ready", emoji: "📄", description: "Upload your resume." },
  { id: "first_apply", label: "Feet Wet", emoji: "🎯", description: "Apply to your first job." },
  { id: "streak_3", label: "On a Roll", emoji: "🔥", description: "3-day activity streak." },
  { id: "streak_7", label: "Unstoppable", emoji: "⚡", description: "7-day activity streak." },
  { id: "ten_apps", label: "Hustler", emoji: "📬", description: "Add 10 jobs to your pipeline." },
  { id: "interview", label: "In the Room", emoji: "🤝", description: "Reach an interview." },
  { id: "offer", label: "Offer Seeker", emoji: "🏆", description: "Land an offer." },
];

export function xpForEvent(kind: ActivityEvent["kind"]): number {
  return XP_VALUES[kind] ?? 0;
}

/** Total XP at the start of a level. Level N costs 100*N XP to reach N+1. */
export function xpAtLevel(level: number): number {
  if (level <= 1) return 0;
  let xp = 0;
  for (let l = 1; l < level; l++) xp += 100 * l;
  return xp;
}

export function levelFromXp(xp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
} {
  let level = 1;
  let remaining = Math.max(0, xp);
  for (;;) {
    const cost = 100 * level;
    if (remaining < cost) break;
    remaining -= cost;
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: 100 * level };
}

/** Consecutive-day streak ending today (or yesterday). `days` are date-only keys. */
export function computeStreak(activityDays: Set<string>, now = new Date()): number {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const cursor = new Date(now);
  if (!activityDays.has(fmt(cursor))) {
    // Allow the streak to survive if they were active yesterday but not yet today.
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  for (;;) {
    if (activityDays.has(fmt(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export interface GameInputs {
  events: ActivityEvent[];
  resumeUploaded: boolean;
  onboardingCompleted: boolean;
  applicationStatuses: string[];
  now?: Date;
}

export function computeGameState(inputs: GameInputs): GameState {
  const {
    events,
    resumeUploaded,
    onboardingCompleted,
    applicationStatuses,
    now = new Date(),
  } = inputs;

  let xp = events.reduce((sum, e) => sum + xpForEvent(e.kind), 0);
  if (resumeUploaded) xp += BONUS_XP.resume_uploaded;
  if (onboardingCompleted) xp += BONUS_XP.onboarding_completed;

  const applyCount = events.filter((e) => e.kind === "apply").length;
  const appCount = applicationStatuses.length;
  const interviewCount = applicationStatuses.filter((s) => s === "interviewing")
    .length;
  const offerCount = applicationStatuses.filter((s) => s === "offer").length;

  if (applyCount > 0) xp += BONUS_XP.first_apply;
  xp += interviewCount * BONUS_XP.interview;
  xp += offerCount * BONUS_XP.offer;

  const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(xp);

  const activityDays = new Set(
    events.map((e) => new Date(e.at).toISOString().slice(0, 10)),
  );
  const streakDays = computeStreak(activityDays, now);

  const earned = new Set<string>();
  if (onboardingCompleted) earned.add("onboarded");
  if (resumeUploaded) earned.add("resume");
  if (applyCount > 0) earned.add("first_apply");
  if (streakDays >= 3) earned.add("streak_3");
  if (streakDays >= 7) earned.add("streak_7");
  if (appCount >= 10) earned.add("ten_apps");
  if (interviewCount > 0) earned.add("interview");
  if (offerCount > 0) earned.add("offer");

  const badges = BADGES.filter((b) => earned.has(b.id));
  const nextBadge = BADGES.find((b) => !earned.has(b.id)) ?? null;

  return { xp, level, xpIntoLevel, xpForNextLevel, streakDays, badges, nextBadge };
}
