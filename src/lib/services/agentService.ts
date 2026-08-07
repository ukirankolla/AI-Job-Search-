import { retrieveChunks } from "@/lib/rag/retrieve";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLinkedInDescription } from "@/lib/jobs/linkedin";
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

  const posting = job as JobPosting;
  if (!posting.description && posting.source === "linkedin" && posting.url) {
    const description = await fetchLinkedInDescription(posting.url).catch(
      () => "",
    );
    if (description) {
      posting.description = description;
      try {
        await admin.from("jobs").update({ description }).eq("id", jobId);
      } catch {}
    }
  }

  const chunks = await retrieveChunks(profileId, posting.description);

  return {
    profile: profile as Profile,
    chunks: chunks as ProfileChunk[],
    job: posting,
  };
}
