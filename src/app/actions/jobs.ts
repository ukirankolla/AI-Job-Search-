"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type JobActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export const initialState: JobActionState = { ok: false, message: "" };

export async function deleteJob(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  try {
    await requireUser();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing job id." };
  }

  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("source")
    .eq("id", id)
    .single();
  if (!job) return { ok: false, error: "Job not found." };
  if (job.source !== "manual") {
    return { ok: false, error: "Only manually added jobs can be deleted." };
  }

  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  return { ok: true, message: "Job deleted." };
}
