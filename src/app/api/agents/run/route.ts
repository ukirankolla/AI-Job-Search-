import { requireUser } from "@/lib/auth";
import { buildGraph } from "@/lib/agents/graph";
import { loadAgentInput } from "@/lib/services/agentService";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  let body: {
    jobId?: string;
    applicationId?: string;
    runType?: "analyze" | "apply" | "prep";
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const runType = body.runType ?? "analyze";
  if (!body.jobId) {
    return Response.json({ error: "jobId is required" }, { status: 400 });
  }

  return streamRun(userId, body.jobId, body.applicationId, runType);
}

async function streamRun(
  userId: string,
  jobId: string,
  applicationId: string | undefined,
  runType: "analyze" | "apply" | "prep",
) {
  const admin = createAdminClient();

  const { data: run, error: runError } = await admin
    .from("agent_runs")
    .insert({
      user_id: userId,
      run_type: runType,
      application_id: applicationId ?? null,
      status: "running",
      steps: [],
    })
    .select("id")
    .single();
  if (runError) {
    return Response.json({ error: runError.message }, { status: 500 });
  }
  const runId = run.id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const input = await loadAgentInput(userId, jobId);
        send("meta", { runId, runType });

        const graph = buildGraph(runType);
        const graphStream = await graph.stream(
          { input },
          { streamMode: "updates" as const },
        );

        const merged: Record<string, unknown> = {};
        const steps: unknown[] = [];

        for await (const update of graphStream) {
          const nodeUpdate = update as Record<string, Record<string, unknown>>;
          for (const [nodeName, values] of Object.entries(nodeUpdate)) {
            if (Array.isArray(values.steps)) {
              for (const s of values.steps) {
                steps.push(s);
                await admin.from("agent_runs").update({ steps }).eq("id", runId);
                send("step", s);
              }
            }
            Object.assign(merged, {
              match: values.match ?? merged.match,
              tailor: values.tailor ?? merged.tailor,
              prep: values.prep ?? merged.prep,
              error: values.error ?? merged.error,
            });
            void nodeName;
          }
        }

        if (merged.error) {
          await admin
            .from("agent_runs")
            .update({ status: "failed", error: merged.error })
            .eq("id", runId);
          send("error", { runId, error: merged.error });
          return;
        }

        await admin
          .from("agent_runs")
          .update({ status: "completed" })
          .eq("id", runId);

        await persistApplicationResults(
          applicationId,
          merged as {
            match?: { score: number; summary: string };
            tailor?: { resume: string; cover_letter: string };
            prep?: { summary: string; questions: unknown[]; tips: string[] };
          },
        );

        send("done", { runId, results: merged });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await admin
          .from("agent_runs")
          .update({ status: "failed", error: message })
          .eq("id", runId);
        send("error", { runId, error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function persistApplicationResults(
  applicationId: string | undefined,
  merged: {
    match?: { score: number; summary: string };
    tailor?: { resume: string; cover_letter: string };
    prep?: { summary: string; questions: unknown[]; tips: string[] };
  },
) {
  if (!applicationId) return;
  const admin = createAdminClient();

  if (merged.match) {
    await admin
      .from("applications")
      .update({
        match_score: merged.match.score,
        match_reason: merged.match.summary,
      })
      .eq("id", applicationId);
  }

  if (merged.tailor) {
    await admin
      .from("tailored_documents")
      .delete()
      .eq("application_id", applicationId);
    await admin.from("tailored_documents").insert([
      {
        application_id: applicationId,
        doc_type: "resume",
        content: merged.tailor.resume,
      },
      {
        application_id: applicationId,
        doc_type: "cover_letter",
        content: merged.tailor.cover_letter,
      },
    ]);
  }

  if (merged.prep) {
    await admin
      .from("interview_preps")
      .delete()
      .eq("application_id", applicationId);
    await admin.from("interview_preps").insert({
      application_id: applicationId,
      content: merged.prep,
    });
  }
}
