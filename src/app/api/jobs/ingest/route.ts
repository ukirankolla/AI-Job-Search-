import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  let inserted = 0;
  let skipped = 0;

  for (const job of parsed.data.jobs) {
    const source = job.source ?? "feed";
    const payload = {
      source,
      external_id: job.external_id ?? null,
      title: job.title,
      company: job.company ?? "",
      location: job.location ?? "",
      description: job.description ?? "",
      url: job.url ?? "",
      salary_min: job.salary_min ?? null,
      salary_max: job.salary_max ?? null,
      posted_at: job.posted_at ?? null,
    };

    if (source !== "manual" && job.external_id) {
      const { data: existing } = await supabase
        .from("jobs")
        .select("id")
        .eq("source", source)
        .eq("external_id", job.external_id)
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }
    }

    const { error } = await supabase.from("jobs").insert(payload);
    if (error) {
      if (error.code === "23505") {
        skipped++;
        continue;
      }
      return Response.json({ error: error.message }, { status: 500 });
    }
    inserted++;
  }

  return Response.json({ inserted, skipped });
}
