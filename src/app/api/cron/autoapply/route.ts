import { isCronRequestAuthorized } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAutoApplyForUser } from "@/lib/autoApply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (
    !isCronRequestAuthorized(process.env.CRON_SECRET, {
      "x-cron-secret": request.headers.get("x-cron-secret"),
      authorization: request.headers.get("authorization"),
    })
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("auto_apply_settings")
    .select("user_id")
    .eq("enabled", true);

  const results: Array<Record<string, unknown>> = [];
  for (const row of rows ?? []) {
    try {
      const summary = await runAutoApplyForUser(row.user_id as string);
      results.push({ userId: row.user_id, ...summary });
    } catch (err) {
      results.push({
        userId: row.user_id,
        state: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return Response.json({ users: rows?.length ?? 0, results });
}
