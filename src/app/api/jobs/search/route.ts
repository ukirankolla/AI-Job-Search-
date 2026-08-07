import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { searchJobs } from "@/lib/jobs/search";
import {
  ingestJobs,
  type IngestClient,
} from "@/lib/services/jobIngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    query?: unknown;
    hours?: unknown;
    types?: unknown;
    location?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const hours = Math.min(Math.max(Number(body.hours) || 8, 1), 72);
  const types = Array.isArray(body.types)
    ? body.types.filter((t): t is string => typeof t === "string")
    : [];
  const location =
    (typeof body.location === "string" ? body.location.trim() : "") ||
    "United States";

  const { jobs, sources, warnings } = await searchJobs({
    query,
    hours,
    employmentTypes: types,
    location,
  });

  if (jobs.length === 0) {
    const allFailed =
      warnings.length > 0 &&
      sources.length === 0 &&
      !jobs.length;
    return Response.json(
      {
        found: 0,
        inserted: 0,
        skipped: 0,
        message:
          warnings.length > 0 && allFailed
            ? `Could not reach any job source. ${warnings.join(" ")}`
            : "No jobs found for that search. Try different keywords or a wider time window.",
      },
      allFailed ? { status: 502 } : { status: 200 },
    );
  }

  const supabase = await createClient();
  try {
    const counts = await ingestJobs(supabase as unknown as IngestClient, jobs);
    return Response.json({
      source: "multi",
      hours,
      location,
      found: jobs.length,
      sources,
      ...counts,
      ...(warnings.length > 0 ? { warnings } : {}),
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
