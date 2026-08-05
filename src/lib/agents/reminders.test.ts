import { describe, expect, it } from "vitest";
import {
  buildDeadlineReminders,
  type DeadlineApp,
} from "@/lib/agents/reminders";

const NOW = new Date("2026-07-20T12:00:00");

function app(overrides: Partial<DeadlineApp>): DeadlineApp {
  return {
    id: "a1",
    status: "applied",
    deadline: null,
    custom_title: "",
    custom_company: "",
    job: null,
    ...overrides,
  };
}

describe("buildDeadlineReminders", () => {
  it("returns an empty list when there are no applications", () => {
    expect(buildDeadlineReminders([], [], NOW)).toEqual([]);
  });

  it("reminds for an application closing within the window", () => {
    const [reminder] = buildDeadlineReminders(
      [
        app({
          id: "a1",
          deadline: "2026-07-25",
          custom_title: "Frontend Engineer",
          custom_company: "Acme",
        }),
      ],
      [],
      NOW,
    );

    expect(reminder).toEqual({
      title: "Deadline approaching: Frontend Engineer",
      body: "The Frontend Engineer role at Acme closes in 5 days.",
      payload: {
        application_id: "a1",
        priority: "normal",
        days_left: 5,
      },
    });
  });

  it("marks near deadlines as high priority", () => {
    const [reminder] = buildDeadlineReminders(
      [app({ id: "a1", deadline: "2026-07-22", job: { title: "Backend" } })],
      [],
      NOW,
    );

    expect(reminder.body).toBe("The Backend application closes in 2 days.");
    expect(reminder.payload.priority).toBe("high");
  });

  it("uses 'today' and 'tomorrow' phrasing", () => {
    const reminders = buildDeadlineReminders(
      [
        app({ id: "a1", deadline: "2026-07-20" }),
        app({ id: "a2", deadline: "2026-07-21" }),
      ],
      [],
      NOW,
    );

    expect(reminders[0].body).toContain("closes today");
    expect(reminders[1].body).toContain("closes tomorrow");
  });

  it("skips applications with no deadline", () => {
    expect(buildDeadlineReminders([app({ id: "a1" })], [], NOW)).toEqual([]);
  });

  it("skips applications already reminded", () => {
    expect(
      buildDeadlineReminders(
        [app({ id: "a1", deadline: "2026-07-25" })],
        ["a1"],
        NOW,
      ),
    ).toEqual([]);
  });

  it("skips applications whose deadline already passed", () => {
    expect(
      buildDeadlineReminders(
        [app({ id: "a1", deadline: "2026-07-19" })],
        [],
        NOW,
      ),
    ).toEqual([]);
  });

  it("skips applications outside the window", () => {
    expect(
      buildDeadlineReminders(
        [app({ id: "a1", deadline: "2026-08-10" })],
        [],
        NOW,
        14,
      ),
    ).toEqual([]);
  });

  it("respects a custom window", () => {
    const reminders = buildDeadlineReminders(
      [
        app({ id: "a1", deadline: "2026-07-27" }),
        app({ id: "a2", deadline: "2026-08-01" }),
      ],
      [],
      NOW,
      7,
    );

    expect(reminders).toHaveLength(1);
    expect(reminders[0].payload.application_id).toBe("a1");
  });

  it("skips unparseable deadline strings", () => {
    expect(
      buildDeadlineReminders([app({ id: "a1", deadline: "not-a-date" })], [], NOW),
    ).toEqual([]);
  });
});
