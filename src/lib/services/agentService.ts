import { buildGraph, GraphState, message, type RunType } from "@/lib/agents/graph";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentInput, JobPosting, Profile, ProfileChunk } from "@/lib/types";

export interface AgentContext {
  profileId: string;
  jobId: string;
  applicationId?: string;
  runType: RunType;
}

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

export async function createAgentRun(ctx: AgentContext): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("agent_runs")
    .insert({
      user_id: ctx.profileId,
      run_type: ctx.runType,
      application_id: ctx.applicationId ?? null,
      status: "running",
      steps: [],
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create agent run: ${error.message}`);
  return data.id;
}

export async function runAgents(ctx: AgentContext): Promise<void> {
  const runId = await createAgentRun(ctx);
  const admin = createAdminClient();
  const input = await loadAgentInput(ctx.profileId, ctx.jobId);
  const graph = buildGraph(ctx.runType);

  const stream = await graph.stream(
    { input },
    { streamMode: "updates" as const },
  );

  const steps: unknown[] = [];
  const merged: FinalState = {};

  for await (const update of stream) {
    const nodeUpdate = update as Record<string, Partial<typeof GraphState.State>>;
    for (const [nodeName, values] of Object.entries(nodeUpdate)) {
      void nodeName;
      if (Array.isArray(values.steps)) {
        for (const s of values.steps) {
          steps.push(s);
          await admin
            .from("agent_runs")
            .update({ steps })
            .eq("id", runId);
        }
      }
      Object.assign(merged, {
        match: values.match ?? merged.match,
        tailor: values.tailor ?? merged.tailor,
        prep: values.prep ?? merged.prep,
        error: values.error ?? merged.error,
      });
    }
  }

  if (merged.error) {
    await admin
      .from("agent_runs")
      .update({ status: "failed", error: merged.error })
      .eq("id", runId);
    return;
  }

  await admin
    .from("agent_runs")
    .update({ status: "completed" })
    .eq("id", runId);

  await persistResults(ctx, merged);
}

interface FinalState {
  match?: { score: number; summary: string };
  tailor?: { resume: string; cover_letter: string };
  prep?: { summary: string; questions: unknown[]; tips: string[] };
  error?: string | null;
}

async function persistResults(ctx: AgentContext, state: FinalState | undefined) {
  if (!ctx.applicationId || !state) return;
  const admin = createAdminClient();

  if (state.match) {
    await admin
      .from("applications")
      .update({ match_score: state.match.score, match_reason: state.match.summary })
      .eq("id", ctx.applicationId);
  }

  if (state.tailor) {
    await admin
      .from("tailored_documents")
      .delete()
      .eq("application_id", ctx.applicationId);
    await admin.from("tailored_documents").insert([
      { application_id: ctx.applicationId, doc_type: "resume", content: state.tailor.resume },
      { application_id: ctx.applicationId, doc_type: "cover_letter", content: state.tailor.cover_letter },
    ]);
  }

  if (state.prep) {
    await admin
      .from("interview_preps")
      .delete()
      .eq("application_id", ctx.applicationId);
    await admin.from("interview_preps").insert({
      application_id: ctx.applicationId,
      content: state.prep,
    });
  }
}
