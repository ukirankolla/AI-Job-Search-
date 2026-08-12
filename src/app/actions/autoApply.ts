"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  runAutoApplyForUser,
  DEFAULT_AUTO_APPLY_SETTINGS,
  type AutoApplySummary,
} from "@/lib/autoApply";

const settingsSchema = z.object({
  enabled: z.boolean(),
  min_score: z.coerce.number().int().min(0).max(100),
  max_per_day: z.coerce.number().int().min(1).max(100),
  hours_lookback: z.coerce.number().int().min(1).max(168),
  include_locations: z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean)),
  exclude_companies: z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean)),
  email_submit: z.boolean(),
});

export type SettingsActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export async function saveAutoApplySettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = settingsSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    min_score: formData.get("min_score") ?? DEFAULT_AUTO_APPLY_SETTINGS.min_score,
    max_per_day:
      formData.get("max_per_day") ?? DEFAULT_AUTO_APPLY_SETTINGS.max_per_day,
    hours_lookback:
      formData.get("hours_lookback") ?? DEFAULT_AUTO_APPLY_SETTINGS.hours_lookback,
    include_locations: String(formData.get("include_locations") ?? ""),
    exclude_companies: String(formData.get("exclude_companies") ?? ""),
    email_submit: formData.get("email_submit") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the settings and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("auto_apply_settings").upsert(
    {
      user_id: userId,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/applications");
  return {
    ok: true,
    message: parsed.data.enabled
      ? "Auto-apply is on. The pilot will match and submit jobs on its next run."
      : "Auto-apply is off.",
  };
}

export type RunNowState = {
  ok: boolean;
  summary?: AutoApplySummary;
  error?: string;
};

export async function runAutoApplyNow(): Promise<RunNowState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const summary = await runAutoApplyForUser(userId, 20);
    revalidatePath("/applications");
    return { ok: true, summary };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
