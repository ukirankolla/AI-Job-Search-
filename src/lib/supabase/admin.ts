import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Only use in server-side trusted contexts
 * (cron jobs, migrations, seeders) — never in route handlers that take
 * user input without first authenticating.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
