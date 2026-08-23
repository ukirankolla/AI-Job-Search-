

## Improvements (approved via Agent Etna simulations)
- Formalizing the existing instruction about resume reuse as a custom capability reinforces this expected behavior, preventing redundant requests to the user.
  > {"name":"Resume Reuse","description":"After the user uploads a resume, the agent relies on that resume being chunked and embedded into the pgvector store in Supabase, and reuses it for every later step rather than asking the user to re-upload.","appliesWhen":"user has previously uploaded a resume","preventsFailureModes":["forgetting user-provided resume","asking for resume re-upload"]}
