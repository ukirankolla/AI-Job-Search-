const HOUR_MS = 60 * 60 * 1000;

export function isRecentlyPosted(
  iso: string | undefined | null,
  hours = 8,
  now = new Date(),
): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age >= 0 && age <= hours * HOUR_MS;
}

export function formatRelativeTime(
  iso: string | undefined | null,
  now = new Date(),
): string {
  if (!iso) return "unknown";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "unknown";
  const diff = Math.max(0, now.getTime() - t);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
