import { retrieveChunks } from "@/lib/rag/retrieve";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentInput, JobPosting, Profile, ProfileChunk } from "@/lib/types";

export async function loadAgentInput(
  profileId: string,
  jobId: string,
): Promise<AgentInput> {
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();
  if (profileError) throw new Error("Profile not found");

  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (jobError) throw new Error("Job not found");

  const chunks = await retrieveChunks(profileId, (job as JobPosting).description);

  return {
    profile: profile as Profile,
    chunks: chunks as ProfileChunk[],
    job: job as JobPosting,
  };
}
