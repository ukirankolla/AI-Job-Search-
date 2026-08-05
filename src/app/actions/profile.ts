"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseResume } from "@/lib/agents/workers";

const profileSchema = z.object({
  full_name: z.string().min(1).max(200),
  title: z.string().max(200),
  summary: z.string().max(5000),
  skills: z.string().max(2000),
});

export type ProfileFormState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export const initialState: ProfileFormState = { ok: false, message: "" };

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    skills: formData.get("skills"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please fill in the required fields." };
  }

  const supabase = await createClient();
  const skills = parsed.data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      title: parsed.data.title,
      summary: parsed.data.summary,
      skills,
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  return { ok: true, message: "Profile saved." };
}

export async function uploadResume(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const resumeText = formData.get("resume_text");
  if (typeof resumeText !== "string" || resumeText.trim().length < 10) {
    return { ok: false, error: "Paste your resume text first (min 10 chars)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ resume_text: resumeText, resume_embedding_status: "pending" })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  const res = await fetch(
    new URL("/api/profile/vectorize", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_text: resumeText }),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.error ?? "Failed to index resume." };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Resume uploaded and vectorized." };
}

export async function parseResumeProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const resumeText = formData.get("resume_text");
  if (typeof resumeText !== "string" || resumeText.trim().length < 10) {
    return { ok: false, error: "Paste your resume text first (min 10 chars)." };
  }

  let parsed;
  try {
    parsed = await parseResume(resumeText);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to parse resume.",
    };
  }

  const updates: Record<string, unknown> = {};
  if (parsed.full_name.trim()) updates.full_name = parsed.full_name.trim();
  if (parsed.title.trim()) updates.title = parsed.title.trim();
  if (parsed.summary.trim()) updates.summary = parsed.summary.trim();
  const skills = parsed.skills.map((s) => s.trim()).filter(Boolean);
  if (skills.length > 0) updates.skills = skills;

  if (Object.keys(updates).length === 0) {
    return {
      ok: false,
      error: "Could not extract any profile fields from this resume.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  return {
    ok: true,
    message: "Profile extracted from resume. Review the fields and save.",
  };
}
