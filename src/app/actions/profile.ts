"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseResume } from "@/lib/agents/workers";
import { indexProfile } from "@/lib/rag/embed";

const profileSchema = z.object({
  full_name: z.string().min(1).max(200),
  title: z.string().max(200),
  summary: z.string().max(5000),
  skills: z.string().max(2000),
  email: z.string().email().max(200),
  phone: z.string().max(40),
  country: z.string().max(100),
  city: z.string().max(100),
  linkedin_url: z.string().max(300),
  github_url: z.string().max(300),
  website_url: z.string().max(300),
});

export type ProfileFormState = {
  ok: boolean;
  message?: string;
  error?: string;
};

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
    email: formData.get("email"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    city: formData.get("city"),
    linkedin_url: formData.get("linkedin_url"),
    github_url: formData.get("github_url"),
    website_url: formData.get("website_url"),
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
      email: parsed.data.email,
      phone: parsed.data.phone,
      country: parsed.data.country,
      city: parsed.data.city,
      linkedin_url: parsed.data.linkedin_url,
      github_url: parsed.data.github_url,
      website_url: parsed.data.website_url,
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

  try {
    await indexProfile(userId, resumeText);
  } catch (err) {
    await supabase
      .from("profiles")
      .update({ resume_embedding_status: "failed" })
      .eq("id", userId);
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to index resume.",
    };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Resume uploaded and vectorized." };
}

const MAX_RESUME_FILE_SIZE = 50 * 1024 * 1024;

async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: await file.arrayBuffer() });
    try {
      const result = await parser.getText();
      return result.text ?? "";
    } finally {
      await parser.destroy().catch(() => {});
    }
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      buffer: await file.arrayBuffer(),
    });
    return result.value ?? "";
  }
  if (name.endsWith(".txt")) {
    return await file.text();
  }
  throw new Error("Unsupported file type. Use PDF, Word (.docx), or .txt.");
}

export async function uploadResumeFile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const file = formData.get("resume_file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Choose a resume file first." };
  }
  if (file.size === 0) {
    return { ok: false, error: "The selected file is empty." };
  }
  if (file.size > MAX_RESUME_FILE_SIZE) {
    return { ok: false, error: "File is too large. Max size is 4 MB." };
  }

  let resumeText: string;
  try {
    resumeText = await extractResumeText(file);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Could not read the file. Try a PDF, Word (.docx), or .txt.",
    };
  }

  if (resumeText.trim().length < 10) {
    return {
      ok: false,
      error:
        "No readable text found in the file. It may be a scanned image — try pasting the text instead.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      resume_text: resumeText,
      resume_embedding_status: "pending",
      resume_filename: file.name,
      resume_file_size: file.size,
    })
    .eq("id", userId);
  if (error) {
    if (String(error.code) === "42703") {
      const fallback = await supabase
        .from("profiles")
        .update({ resume_text: resumeText, resume_embedding_status: "pending" })
        .eq("id", userId);
      if (fallback.error) return { ok: false, error: fallback.error.message };
    } else {
      return { ok: false, error: error.message };
    }
  }

  try {
    await indexProfile(userId, resumeText);
  } catch (err) {
    await supabase
      .from("profiles")
      .update({ resume_embedding_status: "failed" })
      .eq("id", userId);
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to index resume.",
    };
  }

  revalidatePath("/profile");
  return {
    ok: true,
    message: "Resume uploaded, text extracted, and indexed.",
  };
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
    .update({
      resume_text: resumeText,
      resume_embedding_status: "pending",
    })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  return {
    ok: true,
    message: "Profile extracted from resume. Review the fields and save.",
  };
}
