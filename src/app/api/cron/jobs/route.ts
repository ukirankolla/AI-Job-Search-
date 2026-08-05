import { isCronRequestAuthorized } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJobSource } from "@/lib/jobs/sources";
import { isDirectSource } from "@/lib/jobs/applySource";
import {
  ingestJobs,
  type IngestClient,
} from "@/lib/services/jobIngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (
    !isCronRequestAuthorized(process.env.CRON_SECRET, {
      "x-cron-secret": request.headers.get("x-cron-secret"),
      authorization: request.headers.get("authorization"),
    })
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const source = getJobSource();
  if (source.name === "mock") {
    return Response.json({
      source: "mock",
      inserted: 0,
      skipped: 0,
      note: "JOB_SOURCE is mock — set GREENHOUSE_BOARD or LEVER_COMPANY to fetch live jobs.",
    });
  }

  let jobs;
  try {
    jobs = (await source.fetchRecentJobs(8)).filter((j) => isDirectSource(j.url));
  } catch (err) {
    return Response.json(
      { error: `Job source unavailable: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  const admin = createAdminClient();
  const counts = await ingestJobs(admin as unknown as IngestClient, jobs);

  return Response.json({ source: source.name, hours: 8, ...counts });
}
