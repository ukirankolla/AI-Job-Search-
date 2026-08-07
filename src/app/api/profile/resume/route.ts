import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
  md: "text/markdown",
  rtf: "application/rtf",
};

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_file_path, resume_filename")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.resume_file_path) {
    return Response.json({ error: "No resume document uploaded" }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("resumes")
    .download(profile.resume_file_path);
  if (error || !data) {
    return Response.json({ error: "Could not load the resume file" }, { status: 404 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  const name = profile.resume_filename || "resume";
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const inline = ext === "pdf" || ext === "txt" || ext === "md";

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name.replace(/"/g, "")}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
