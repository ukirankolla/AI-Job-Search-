interface CronHeaders {
  "x-cron-secret"?: string | null;
  authorization?: string | null;
}

export function isCronRequestAuthorized(
  expected: string | undefined,
  headers: CronHeaders,
): boolean {
  if (!expected) return false;
  return (
    headers["x-cron-secret"] === expected ||
    headers.authorization === `Bearer ${expected}`
  );
}
