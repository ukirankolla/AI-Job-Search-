import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ingestJobs,
  type IngestClient,
} from "@/lib/services/jobIngest";
import type { JobPosting } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jobSchema = z.object({
  source: z.string().optional(),
  external_id: z.string().optional().nullable(),
  title: z.string().min(1),
  company: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  salary_min: z.number().int().optional().nullable(),
  salary_max: z.number().int().optional().nullable(),
  posted_at: z.string().optional().nullable(),
  employment_type: z.string().optional().nullable(),
  sponsorship: z.string().optional().nullable(),
  apply_url: z.string().optional().nullable(),
  verified_status: z
    .enum(["verified", "likely", "unverified"])
    .optional()
    .nullable(),
  verified_source_url: z.string().optional().nullable(),
});

const bodySchema = z.object({
  jobs: z.array(jobSchema).min(1).max(200),
});

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  try {
    const counts = await ingestJobs(
      supabase as unknown as IngestClient,
      parsed.data.jobs as JobPosting[],
    );
    return Response.json(counts);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
