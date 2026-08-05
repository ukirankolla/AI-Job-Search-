import { runTracker } from "@/lib/agents/workers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TrackerTask } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const start = new Date();
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

  const { data: applications, error } = await admin
    .from("applications")
    .select(
      "id, user_id, status, deadline, match_score, custom_title, custom_company, job:jobs(title, company)",
    )
    .or(`deadline.lte.${end.toISOString()},deadline.is.null`)
    .in("status", ["saved", "applied", "interviewing"]);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const byUser = new Map<
    string,
    Array<Record<string, unknown>>
  >();
  for (const app of applications ?? []) {
    const key = app.user_id as string;
    const list = byUser.get(key) ?? [];
    list.push(app);
    byUser.set(key, list);
  }

  let notifications = 0;
  for (const [userId, apps] of byUser) {
    const context = apps
      .map((a) => {
        const job = a.job as { title?: string; company?: string } | null;
        const name =
          a.custom_title || job?.title || a.custom_company || "a position";
        const company = a.custom_company || job?.company || "";
        const deadline = a.deadline ? `Deadline: ${a.deadline}` : "No deadline";
        return `- ${name} at ${company} [status: ${a.status}] [${deadline}]`;
      })
      .join("\n");

    let tasks: TrackerTask[] = [];
    try {
      tasks = await runTracker(
        `Applications pipeline:\n${context}\n\nGenerate actionable follow-up tasks, prioritising deadlines and stale applications.`,
      );
    } catch {
      tasks = [];
    }

    const existing = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "tracker_run")
      .maybeSingle();

    for (const task of tasks) {
      if (existing?.data?.id) continue;
      const { error: insertError } = await admin
        .from("notifications")
        .insert({
          user_id: userId,
          type: "tracker_run",
          title: task.title,
          body: task.reason,
          payload: { priority: task.priority },
        });
      if (!insertError) notifications++;
    }
  }

  return Response.json({ users: byUser.size, notifications });
}
