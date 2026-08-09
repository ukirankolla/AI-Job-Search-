import { createClient } from "@/lib/supabase/server";
import { computeGameState, type ActivityEvent, type GameState } from "@/lib/gamification";

/** Build the user's game state from real database activity. */
export async function getGameState(userId: string): Promise<GameState> {
  const supabase = await createClient();

  const [usageRes, appsRes, profileRes, runsRes] = await Promise.all([
    supabase
      .from("usage_events")
      .select("kind, created_at")
      .eq("user_id", userId)
      .limit(500),
    supabase
      .from("applications")
      .select("status, created_at")
      .eq("user_id", userId)
      .limit(200),
    supabase
      .from("profiles")
      .select("resume_text, onboarding_completed")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("agent_runs")
      .select("created_at")
      .eq("user_id", userId)
      .limit(200),
  ]);

  const events: ActivityEvent[] = [];

  for (const u of usageRes.data ?? []) {
    if (u.kind === "resume_rewrite" || u.kind === "apply") {
      events.push({ kind: u.kind, at: u.created_at });
    }
  }
  for (const app of appsRes.data ?? []) {
    events.push({ kind: "application_created", at: app.created_at });
  }
  for (const run of runsRes.data ?? []) {
    events.push({ kind: "agent_run", at: run.created_at });
  }

  const statuses = (appsRes.data ?? []).map((a) => a.status);
  const resumeUploaded = Boolean(
    (profileRes.data?.resume_text as string | null)?.trim(),
  );
  const onboardingCompleted =
    profileRes.data?.onboarding_completed === true;

  return computeGameState({
    events,
    resumeUploaded,
    onboardingCompleted,
    applicationStatuses: statuses,
  });
}
