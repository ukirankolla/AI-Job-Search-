export function authCallbackUrl(
  next: string,
  fallbackOrigin?: string,
): string {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    fallbackOrigin?.replace(/\/+$/, "");
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/dashboard";
  if (!origin) return `/auth/callback?next=${encodeURIComponent(safeNext)}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
