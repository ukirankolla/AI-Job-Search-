import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { indexProfile } from "@/lib/rag/embed";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  resume_text: z.string().min(10),
});

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "resume_text is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      resume_text: parsed.data.resume_text,
      resume_embedding_status: "pending",
    })
    .eq("id", user.id);
  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  try {
    const result = await indexProfile(user.id, parsed.data.resume_text);
    return Response.json({ ok: true, chunks: result.count });
  } catch (err) {
    await supabase
      .from("profiles")
      .update({ resume_embedding_status: "failed" })
      .eq("id", user.id);
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
