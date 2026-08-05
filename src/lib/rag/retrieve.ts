import { getEmbeddings } from "@/lib/llm/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileChunk } from "@/lib/types";

export async function retrieveChunks(
  profileId: string,
  query: string,
  limit = 8,
): Promise<ProfileChunk[]> {
  const admin = createAdminClient();

  if (!process.env.OPENAI_API_KEY) {
    const { data, error } = await admin
      .from("profile_chunks")
      .select("id, profile_id, content_type, content, source_label, metadata")
      .eq("profile_id", profileId)
      .limit(limit);
    if (error) throw new Error(`Vector retrieval failed: ${error.message}`);
    return (data ?? []) as ProfileChunk[];
  }

  const embeddings = getEmbeddings();
  const [queryVector] = await embeddings.embedDocuments([query]);

  const { data, error } = await admin.rpc("match_profile_chunks", {
    query_embedding: queryVector,
    p_profile_id: profileId,
    match_threshold: 0.0,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Vector retrieval failed: ${error.message}`);
  }

  return (data ?? []) as ProfileChunk[];
}
