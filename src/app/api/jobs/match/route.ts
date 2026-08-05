import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadAgentInput } from "@/lib/services/agentService";
import { runMatcher } from "@/lib/agents/workers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  jobIds: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("resume_text")
    .eq("id", user.id)
    .single();
  if (!profile?.resume_text?.trim()) {
    return Response.json(
      { error: "Upload your resume first so jobs can be matched to it." },
      { status: 400 },
    );
  }

  let matched = 0;
  let failed = 0;

  for (const jobId of parsed.data.jobIds) {
    try {
      const input = await loadAgentInput(user.id, jobId);
      const result = await runMatcher(input);
      const { error } = await admin.from("job_matches").upsert(
        {
          user_id: user.id,
          job_id: jobId,
          score: result.score,
          summary: result.summary,
          matched_skills: result.matched_skills,
          missing_skills: result.missing_skills,
          strengths: result.strengths,
          concerns: result.concerns,
        },
        { onConflict: "user_id,job_id" },
      );
      if (error) {
        failed++;
      } else {
        matched++;
      }
    } catch {
      failed++;
    }
  }

  return Response.json({ matched, failed });
}
