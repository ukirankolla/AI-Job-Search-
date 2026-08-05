"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const applicationSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum(["saved", "applied", "interviewing", "offer", "rejected"]),
  deadline: z.string().optional().nullable(),
});

const manualJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  description: z.string().min(10),
  url: z.string().optional(),
  deadline: z.string().optional().nullable(),
});

export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  applicationId?: string;
};

export const initialState: ActionState = { ok: false, message: "" };

export async function createApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = applicationSchema.safeParse({
    job_id: formData.get("job_id"),
    status: formData.get("status") ?? "saved",
    deadline: formData.get("deadline") || null,
  });
  if (!parsed.success) return { ok: false, error: "Invalid application data." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userId,
      job_id: parsed.data.job_id,
      status: parsed.data.status,
      deadline: parsed.data.deadline ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/jobs");
  revalidatePath("/applications");
  return { ok: true, message: "Added to your pipeline.", applicationId: data.id };
}

export async function updateApplicationStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const id = formData.get("id");
  const status = formData.get("status");
  const parsed = applicationSchema.pick({ status: true }).safeParse({ status });
  if (typeof id !== "string" || !parsed.success) {
    return { ok: false, error: "Invalid data." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/applications");
  return { ok: true, message: "Status updated." };
}

export async function deleteApplication(formData: FormData): Promise<ActionState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const id = formData.get("id");
  if (typeof id !== "string") return { ok: false, error: "Invalid data." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/applications");
  return { ok: true, message: "Application removed." };
}

export async function addManualJob(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = manualJobSchema.safeParse({
    title: formData.get("title"),
    company: formData.get("company"),
    location: formData.get("location") || undefined,
    description: formData.get("description"),
    url: formData.get("url") || undefined,
    deadline: formData.get("deadline") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: "Title, company and description are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      source: "manual",
      title: parsed.data.title,
      company: parsed.data.company,
      location: parsed.data.location ?? "",
      description: parsed.data.description,
      url: parsed.data.url ?? "",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const { error: appError } = await supabase.from("applications").insert({
    user_id: userId,
    job_id: data.id,
    status: "saved",
    deadline: parsed.data.deadline ?? null,
  });
  if (appError) return { ok: false, error: appError.message };

  revalidatePath("/jobs");
  revalidatePath("/applications");
  return { ok: true, message: "Job added and saved to your pipeline." };
}
