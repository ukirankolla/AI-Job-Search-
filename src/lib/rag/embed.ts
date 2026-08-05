import { getEmbeddings } from "@/lib/llm/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { chunkResume } from "@/lib/rag/chunk";

export async function indexProfile(profileId: string, resumeText: string) {
  const admin = createAdminClient();
  const chunks = chunkResume(resumeText);

  await admin
    .from("profile_chunks")
    .delete()
    .eq("profile_id", profileId);

  if (chunks.length === 0) {
    return { count: 0 };
  }

  const embeddings = await getEmbeddings();
  const vectors = await embeddings.embedDocuments(chunks.map((c) => c.content));

  const rows = chunks.map((c, i) => ({
    profile_id: profileId,
    content_type: c.content_type,
    content: c.content,
    source_label: c.source_label,
    embedding: vectors[i],
    metadata: c.metadata,
  }));

  const { data, error } = await admin.from("profile_chunks").insert(rows);

  if (error) {
    throw new Error(`Failed to store embeddings: ${error.message}`);
  }

  await admin
    .from("profiles")
    .update({ resume_embedding_status: "done" })
    .eq("id", profileId);

  return { count: rows.length };
}
