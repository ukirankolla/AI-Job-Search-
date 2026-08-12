"use client";

import { useActionState } from "react";
import {
  saveAutoApplySettings,
  runAutoApplyNow,
  type SettingsActionState,
  type RunNowState,
} from "@/app/actions/autoApply";
import type { AutoApplySettings } from "@/lib/autoApply";

interface Props {
  settings: AutoApplySettings;
  readyCount: number;
  lastRun: {
    ran_at: string;
    considered: number;
    matched: number;
    submitted: number;
    ready: number;
    skipped: number;
    failed: number;
  } | null;
}

const initialSettingsState: SettingsActionState = { ok: false };

const TONE_CLASS: Record<string, string> = {
  rose: "text-rose-600",
  slate: "text-slate-600",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
};

const stateToMessage = (s: RunNowState) => {
  if (!s.ok) return { text: s.error ?? "Run failed.", tone: "rose" as const };
  if (!s.summary) return { text: "Nothing to do.", tone: "slate" as const };
  const m = s.summary;
  if (m.state === "disabled")
    return { text: "Auto-apply is off — turn it on to run.", tone: "slate" as const };
  if (m.state === "no_resume")
    return { text: "Upload your resume first.", tone: "amber" as const };
  if (m.state === "quota")
    return { text: "Free weekly rewrite limit reached.", tone: "amber" as const };
  if (m.state === "daily_limit")
    return { text: "Daily auto-apply limit reached.", tone: "amber" as const };
  return {
    text: `Checked ${m.considered}, matched ${m.matched} · submitted ${m.submitted}, queued ${m.ready}, skipped ${m.skipped}, failed ${m.failed}.`,
    tone: "emerald" as const,
  };
};

export function AutoApplySettings({ settings, readyCount, lastRun }: Props) {
  const [settingsState, saveAction, settingsPending] = useActionState(
    saveAutoApplySettings,
    initialSettingsState,
  );
  const [runState, runAction, runPending] = useActionState(
    runAutoApplyNow,
    null,
  );

  const runMessage = runState ? stateToMessage(runState) : null;

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            Auto-pilot
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                settings.enabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {settings.enabled ? "On" : "Off"}
            </span>
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Upload your resume once. Each run matches jobs posted in the last
            lookback window, tailors an ATS-friendly resume and cover letter
            for every strong match, submits email-based postings
            automatically, and queues portal postings as one-tap-ready.
          </p>
        </div>

        {lastRun && (
          <dl className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
            <div className="flex items-center justify-between gap-6">
              <dt className="text-slate-400">Last run</dt>
              <dd>{new Date(`${lastRun.ran_at}`).toLocaleString()}</dd>
            </div>
            <div className="mt-1 flex items-center justify-between gap-6">
              <dt className="text-slate-400">This run</dt>
              <dd>
                {lastRun.submitted} submitted · {lastRun.ready} queued ·{" "}
                {lastRun.skipped} skipped · {lastRun.failed} failed
              </dd>
            </div>
            <div className="mt-1 flex items-center justify-between gap-6">
              <dt className="text-slate-400">Ready to finish</dt>
              <dd className="font-medium text-indigo-600">{readyCount}</dd>
            </div>
          </dl>
        )}
      </div>

      <form action={saveAction} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700">
          <span>Automatically apply</span>
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={settings.enabled}
            className="h-4 w-4 accent-indigo-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Min match score
          </span>
          <input
            type="number"
            name="min_score"
            min={0}
            max={100}
            defaultValue={settings.min_score}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Max applies per day
          </span>
          <input
            type="number"
            name="max_per_day"
            min={1}
            max={100}
            defaultValue={settings.max_per_day}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Look back (hours)
          </span>
          <select
            name="hours_lookback"
            defaultValue={settings.hours_lookback}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {[12, 24, 48, 72, 168].map((h) => (
              <option key={h} value={h}>
                {h} hours
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Only locations (comma separated, leave empty for all)
          </span>
          <input
            type="text"
            name="include_locations"
            defaultValue={settings.include_locations.join(", ")}
            placeholder="Remote, New York, San Francisco"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Exclude companies (comma separated)
          </span>
          <input
            type="text"
            name="exclude_companies"
            defaultValue={settings.exclude_companies.join(", ")}
            placeholder="Example Corp, Another Inc"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 sm:col-span-2">
          <span>
            Email-submit postings
            <span className="block text-xs font-normal text-slate-400">
              Automatically email resume + cover letter when a posting accepts
              email applications.
            </span>
          </span>
          <input
            type="checkbox"
            name="email_submit"
            defaultChecked={settings.email_submit}
            className="h-4 w-4 accent-indigo-600"
          />
        </label>

        <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={settingsPending}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {settingsPending ? "Saving…" : "Save settings"}
          </button>
          <button
            type="button"
            disabled={runPending || !settings.enabled}
            onClick={() => runAction()}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {runPending ? "Running…" : "Run auto-apply now"}
          </button>
        </div>
      </form>

      {(settingsState.message || settingsState.error) && (
        <p
          className={`mt-3 text-sm ${
            settingsState.error ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {settingsState.error ?? settingsState.message}
        </p>
      )}
      {runMessage && (
        <p className={`mt-3 text-sm ${TONE_CLASS[runMessage.tone] ?? ""}`}>
          {runMessage.text}
        </p>
      )}
    </section>
  );
}
