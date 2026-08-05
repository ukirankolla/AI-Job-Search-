import { createClient } from "@/lib/supabase/server";

export type UsageKind = "resume_rewrite" | "apply";
export type SubscriptionTier = "free" | "premium";

export interface UsageSnapshot {
  resume_rewrite: number;
  apply: number;
}

export const WEEKLY_FREE_LIMIT = 15;
export const WEEK_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;

export function isAdmin(email?: string | null): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const normalized = email?.trim().toLowerCase() ?? "";
  return Boolean(normalized && admins.includes(normalized));
}

export function canUse(
  tier: SubscriptionTier,
  usage: UsageSnapshot,
  kind: UsageKind,
): boolean {
  if (tier === "premium") return true;
  return usage[kind] < WEEKLY_FREE_LIMIT;
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .maybeSingle();
  return data?.subscription_tier === "premium" ? "premium" : "free";
}

export async function getWeeklyUsage(userId: string): Promise<UsageSnapshot> {
  const supabase = await createClient();
  const since = new Date(Date.now() - WEEK_LIMIT_MS).toISOString();
  const { data } = await supabase
    .from("usage_events")
    .select("kind")
    .eq("user_id", userId)
    .gte("created_at", since);

  const usage: UsageSnapshot = { resume_rewrite: 0, apply: 0 };
  for (const event of data ?? []) {
    if (event.kind === "resume_rewrite") usage.resume_rewrite += 1;
    else if (event.kind === "apply") usage.apply += 1;
  }
  return usage;
}

export interface UsageSummary {
  tier: SubscriptionTier;
  admin: boolean;
  usage: UsageSnapshot;
  limit: number;
}

export async function getUsageSummary(
  userId: string,
  email?: string | null,
): Promise<UsageSummary> {
  const [tier, usage] = await Promise.all([
    getUserTier(userId),
    getWeeklyUsage(userId),
  ]);
  return { tier, admin: isAdmin(email), usage, limit: WEEKLY_FREE_LIMIT };
}

export type QuotaResult =
  | { allowed: true; usage: UsageSnapshot; tier: SubscriptionTier }
  | {
      allowed: false;
      usage: UsageSnapshot;
      tier: SubscriptionTier;
      limit: number;
    };

export async function assertQuota(
  userId: string,
  kind: UsageKind,
): Promise<QuotaResult> {
  const [tier, usage] = await Promise.all([
    getUserTier(userId),
    getWeeklyUsage(userId),
  ]);
  if (canUse(tier, usage, kind)) {
    return { allowed: true, usage, tier };
  }
  return { allowed: false, usage, tier, limit: WEEKLY_FREE_LIMIT };
}

export async function recordUsage(userId: string, kind: UsageKind) {
  const supabase = await createClient();
  const { error } = await supabase.from("usage_events").insert({
    user_id: userId,
    kind,
  });
  if (error) throw new Error(error.message);
}
