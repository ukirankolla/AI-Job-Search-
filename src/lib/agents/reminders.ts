import type { ApplicationStatus } from "@/lib/types";

export interface DeadlineApp {
  id: string;
  status: ApplicationStatus;
  deadline: string | null;
  custom_title: string;
  custom_company: string;
  job?: { title?: string; company?: string } | null;
}

export interface ReminderDraft {
  title: string;
  body: string;
  payload: Record<string, unknown>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntil(deadline: string, now: Date): number {
  const deadlineDate = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(deadlineDate.getTime())) return Number.NaN;
  return Math.round(
    (deadlineDate.getTime() - startOfDay(now).getTime()) / DAY_MS,
  );
}

function when(daysLeft: number): string {
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  return `in ${daysLeft} days`;
}

export function buildDeadlineReminders(
  apps: DeadlineApp[],
  existingApplicationIds: string[],
  now: Date,
  windowDays = 14,
): ReminderDraft[] {
  const already = new Set(existingApplicationIds);
  const reminders: ReminderDraft[] = [];

  for (const app of apps) {
    if (!app.deadline || already.has(app.id)) continue;

    const daysLeft = daysUntil(app.deadline, now);
    if (Number.isNaN(daysLeft) || daysLeft < 0 || daysLeft > windowDays) {
      continue;
    }

    const name = app.custom_title || app.job?.title || "a position";
    const company = app.custom_company || app.job?.company;
    const priority = daysLeft <= 3 ? "high" : "normal";

    reminders.push({
      title: `Deadline approaching: ${name}`,
      body: company
        ? `The ${name} role at ${company} closes ${when(daysLeft)}.`
        : `The ${name} application closes ${when(daysLeft)}.`,
      payload: {
        application_id: app.id,
        priority,
        days_left: daysLeft,
      },
    });
  }

  return reminders;
}
