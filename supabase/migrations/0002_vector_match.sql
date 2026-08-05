-- pgvector similarity search over profile_chunks
create or replace function public.match_profile_chunks(
  query_embedding vector(1536),
  p_profile_id uuid,
  match_threshold float default 0.0,
  match_count int default 8
)
returns table (
  id uuid,
  profile_id uuid,
  content_type text,
  content text,
  source_label text,
  metadata jsonb,
  similarity float
)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
  select
    pc.id,
    pc.profile_id,
    pc.content_type,
    pc.content,
    pc.source_label,
    pc.metadata,
    1 - (pc.embedding <=> query_embedding) as similarity
  from public.profile_chunks pc
  where pc.profile_id = p_profile_id
    and pc.embedding is not null
    and 1 - (pc.embedding <=> query_embedding) > match_threshold
  order by pc.embedding <=> query_embedding
  limit match_count;
end;
$$;
