"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseSseBuffer, parseSseEvent } from "@/lib/sse";
import type { AgentName, AgentStep } from "@/lib/types";

const AGENT_LABELS: Record<AgentName, string> = {
  retrieve: "Retriever",
  matcher: "Matcher",
  tailor: "Tailor",
  prep: "Prep",
  tracker: "Tracker",
};

interface Props {
  jobId: string;
  applicationId: string;
}

export function CardAnalyzeButton({ jobId, applicationId }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle",
  );
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setStatus("running");
    setSteps([]);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, applicationId, runType: "analyze" }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to start analysis.");
        setStatus("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleEvent = (event: string, raw: string) => {
        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch {
          return;
        }
        if (event === "step") {
          const s = data as AgentStep;
          setSteps((prev) => [
            ...prev.filter((x) => x.agent !== s.agent || x.status !== "running"),
            s,
          ]);
        } else if (event === "done") {
          setStatus("done");
          router.refresh();
        } else if (event === "error") {
          const { error: runError } = data as { error?: string };
          setError(runError ?? "Analysis failed.");
          setStatus("error");
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const { events, rest } = parseSseBuffer(
          decoder.decode(value, { stream: true }),
          buffer,
        );
        buffer = rest;
        for (const evt of events) handleEvent(evt.event, evt.data);
      }
      if (buffer) {
        const evt = parseSseEvent(buffer);
        if (evt) handleEvent(evt.event, evt.data);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    } finally {
      setRunning(false);
    }
  }, [jobId, applicationId, running, router]);

  const visible = running || steps.length > 0 || status === "error";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={start}
          disabled={running}
          title="Run AI analysis for this role"
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          {running ? (
            <>
              <span className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 align-middle" />
              Analyze…
            </>
          ) : (
            <>✦ Analyze</>
          )}
        </button>
        {status === "done" && (
          <span className="text-xs text-emerald-600" title="Analysis updated">
            ✓
          </span>
        )}
      </div>

      {visible && (
        <ul className="w-44 space-y-1 rounded-md border border-slate-200 bg-white p-2 text-xs">
          {steps.map((s, i) => (
            <li key={`${s.agent}-${i}`} className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  s.status === "completed"
                    ? "bg-emerald-500"
                    : s.status === "failed"
                      ? "bg-rose-500"
                      : "animate-pulse bg-amber-400"
                }`}
              />
              <span className="text-slate-700">
                {AGENT_LABELS[s.agent] ?? s.agent}
              </span>
              <span className="truncate text-slate-400">
                {s.status === "running"
                  ? "working…"
                  : s.status === "completed"
                    ? "done"
                    : "failed"}
              </span>
            </li>
          ))}
          {running && (
            <li className="flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-300" />
              orchestrating…
            </li>
          )}
          {status === "error" && (
            <li className="truncate font-medium text-rose-600" title={error ?? ""}>
              {error}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
