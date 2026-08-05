import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getJobSource } from "@/lib/jobs/sources";
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

  const url = new URL(request.url);
  const hours = Math.min(
    Math.max(Number(url.searchParams.get("hours") ?? 8) || 8, 1),
    72,
  );

  const source = getJobSource();

  let jobs;
  try {
    jobs = await source.fetchRecentJobs(hours);
  } catch (err) {
    return Response.json(
      { error: `Job source unavailable: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  const supabase = await createClient();
  try {
    const counts = await ingestJobs(supabase as unknown as IngestClient, jobs);
    return Response.json({ source: source.name, hours, ...counts });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
