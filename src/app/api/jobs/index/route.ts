import { requireUser } from "@/lib/auth";
import { isCronRequestAuthorized } from "@/lib/cron";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCareerPages } from "@/lib/jobs/careerPages";
import { crawlCareerPages } from "@/lib/jobs/careerIndexer";
import {
  ingestJobs,
  type IngestClient,
} from "@/lib/services/jobIngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Careers pages rarely change hourly; a rolling 7-day window keeps a useful
// pool in the index, which the feed's 4/8/12h/All filter then narrows.
const INDEX_HOURS = 7 * 24;

export async function GET(request: Request) {
  if (
    !isCronRequestAuthorized(process.env.CRON_SECRET, {
      "x-cron-secret": request.headers.get("x-cron-secret"),
      authorization: request.headers.get("authorization"),
    })
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pages = getCareerPages();
  const { jobs, errors } = await crawlCareerPages(pages, INDEX_HOURS);
  const admin = createAdminClient();
  const counts = await ingestJobs(admin as unknown as IngestClient, jobs);
  return Response.json({
    pages: pages.length,
    ...counts,
    ...(errors.length > 0 ? { errors } : {}),
  });
}

export async function POST() {
  try {
    await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pages = getCareerPages();
  const { jobs, errors } = await crawlCareerPages(pages, INDEX_HOURS);
  const supabase = await createClient();
  try {
    const counts = await ingestJobs(supabase as unknown as IngestClient, jobs);
    return Response.json({
      pages: pages.length,
      found: jobs.length,
      ...counts,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
