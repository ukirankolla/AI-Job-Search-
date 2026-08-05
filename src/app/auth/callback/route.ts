import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isLocalEnv = process.env.NODE_ENV === "development";

function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

function redirectTo(
  request: Request,
  pathname: string,
  params: Record<string, string> = {},
) {
  const { origin } = new URL(request.url);
  const url = new URL(pathname, origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (providerError) {
    return redirectTo(request, "/auth/auth-code-error", {
      description: providerError,
    });
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    return redirectTo(request, "/auth/auth-code-error", {
      description: error.message,
    });
  }

  return redirectTo(request, "/auth/auth-code-error", {
    description: "No authorization code was provided.",
  });
}
