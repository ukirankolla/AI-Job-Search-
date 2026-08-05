import { describe, expect, it } from "vitest";
import type { TrackerTask } from "@/lib/types";
import { filterNewTrackerTasks } from "@/lib/agents/tracker";

const task = (title: string): TrackerTask => ({
  id: `t-${title}`,
  title,
  priority: "medium",
  reason: "because",
});

describe("filterNewTrackerTasks", () => {
  it("keeps tasks whose title has not been notified before", () => {
    const tasks = [task("Follow up"), task("Update resume")];
    expect(filterNewTrackerTasks(tasks, [])).toEqual(tasks);
  });

  it("drops tasks whose title already exists in notifications", () => {
    const tasks = [task("Follow up"), task("Update resume")];
    const result = filterNewTrackerTasks(tasks, ["Follow up"]);
    expect(result).toEqual([task("Update resume")]);
  });

  it("drops entries without a title", () => {
    const tasks = [
      { id: "x", priority: "high", reason: "no title" },
      task("Send thank-you note"),
    ] as unknown as TrackerTask[];
    const result = filterNewTrackerTasks(tasks, []);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Send thank-you note");
  });

  it("returns an empty array for empty input", () => {
    expect(filterNewTrackerTasks([], ["Anything"])).toEqual([]);
  });

  it("is case-sensitive when matching titles", () => {
    const result = filterNewTrackerTasks([task("Follow up")], ["follow up"]);
    expect(result).toEqual([task("Follow up")]);
  });
});
