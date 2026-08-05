"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertQuota, isAdmin, recordUsage } from "@/lib/subscription";

export type ApplyForJobResult =
  | { ok: true; url: string }
  | {
      ok: false;
      limitReached: boolean;
      message?: string;
      usage?: { resume_rewrite: number; apply: number };
      limit?: number;
    };

export async function applyForJob(
  jobId: string,
  url: string,
): Promise<ApplyForJobResult> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, limitReached: false, message: "Unauthorized" };
  }

  if (!z.string().url().safeParse(url).success) {
    return { ok: false, limitReached: false, message: "Invalid job URL" };
  }

  const quota = await assertQuota(userId, "apply");
  if (!quota.allowed) {
    return {
      ok: false,
      limitReached: true,
      usage: quota.usage,
      limit: quota.limit,
    };
  }

  try {
    await recordUsage(userId, "apply");
  } catch {
    return { ok: false, limitReached: false, message: "Failed to record apply" };
  }

  return { ok: true, url };
}

export type GrantPremiumResult = {
  ok: boolean;
  message?: string;
  granted?: string;
};

export const grantPremiumInitial: GrantPremiumResult = {
  ok: false,
  message: "",
};

export async function grantPremium(
  _prev: GrantPremiumResult,
  formData: FormData,
): Promise<GrantPremiumResult> {
  let adminEmail: string | undefined;
  try {
    adminEmail = (await requireUser()).email;
  } catch {
    return { ok: false, message: "Unauthorized" };
  }
  if (!isAdmin(adminEmail)) {
    return { ok: false, message: "Admins only" };
  }

  const parsed = z.string().email().safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }
  const target = parsed.data.toLowerCase();

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", target)
    .maybeSingle();
  if (!profile) {
    return { ok: false, message: "No user with that email found." };
  }

  const { error } = await admin
    .from("profiles")
    .update({ subscription_tier: "premium" })
    .eq("id", profile.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/upgrade");
  return { ok: true, granted: target };
}
