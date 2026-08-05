import type { TrackerTask } from "@/lib/types";

export function filterNewTrackerTasks(
  tasks: TrackerTask[],
  existingTitles: string[],
): TrackerTask[] {
  const seen = new Set(existingTitles);
  return tasks.filter(
    (t) => t && typeof t.title === "string" && !seen.has(t.title),
  );
}
