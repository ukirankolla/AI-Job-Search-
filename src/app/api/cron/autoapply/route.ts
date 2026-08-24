import { isCronRequestAuthorized } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAutoApplyForUser } from "@/lib/autoApply";
import { sendAutoApplyDigestEmail } from "@/lib/email";

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

  const userIds = (rows ?? []).map((row) => row.user_id as string);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);
  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );

  const results: Array<Record<string, unknown>> = [];
  for (const row of rows ?? []) {
    const userId = row.user_id as string;
    try {
      const summary = await runAutoApplyForUser(userId);

      let digestSent = false;
      if (summary.items.length > 0) {
        const profile = profileById.get(userId);
        if (profile?.email) {
          digestSent = await sendAutoApplyDigestEmail({
            to: profile.email,
            name: (profile.full_name as string) || "",
            items: summary.items,
          });
        }
      }

      results.push({ userId, digestSent, ...summary });
    } catch (err) {
      results.push({
        userId,
        state: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return Response.json({ users: rows?.length ?? 0, results });
}
