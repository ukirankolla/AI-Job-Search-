"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentStep, AgentName } from "@/lib/types";

const AGENT_LABELS: Record<AgentName, string> = {
  retrieve: "Retriever",
  matcher: "Matcher",
  tailor: "Tailor",
  prep: "Prep",
  tracker: "Tracker",
};

export type AgentRunType = "analyze" | "apply" | "prep";

interface Props {
  jobId: string;
  applicationId?: string;
  runType: AgentRunType;
  label?: string;
  onDone?: (results: Record<string, unknown>) => void;
}

interface AgentEvent {
  event: "meta" | "step" | "done" | "error";
  data: unknown;
}

export function AgentRunner({
  jobId,
  applicationId,
  runType,
  label,
  onDone,
}: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle",
  );
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
        body: JSON.stringify({ jobId, applicationId, runType }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to start agents.");
        setStatus("error");
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleLine = (line: string) => {
        if (!line || !line.startsWith("data: ")) return;
        const raw = line.slice(6);
        let evt: AgentEvent;
        try {
          evt = JSON.parse(raw) as AgentEvent;
        } catch {
          return;
        }
        switch (evt.event) {
          case "step": {
            const s = evt.data as AgentStep;
            setSteps((prev) => [...prev.filter((x) => x.agent !== s.agent || x.status !== "running"), s]);
            break;
          }
          case "done": {
            const data = evt.data as { results: Record<string, unknown> };
            setStatus("done");
            setRunning(false);
            onDone?.(data.results ?? {});
            router.refresh();
            break;
          }
          case "error": {
            const data = evt.data as { error: string };
            setError(data.error);
            setStatus("error");
            setRunning(false);
            break;
          }
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          for (const line of part.split("\n")) handleLine(line);
        }
      }
      if (buffer) {
        for (const line of buffer.split("\n")) handleLine(line);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    } finally {
      setRunning(false);
    }
  }, [jobId, applicationId, runType, running, onDone, router]);

  const visible = running || steps.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={running}
        className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {running ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Agents working…
          </>
        ) : (
          <>▶ {label ?? "Run agents"}</>
        )}
      </button>

      {visible && (
        <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          {steps.map((s, i) => (
            <div key={`${s.agent}-${i}`} className="flex items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  s.status === "completed"
                    ? "bg-emerald-500"
                    : s.status === "failed"
                      ? "bg-rose-500"
                      : "animate-pulse bg-amber-400"
                }`}
              />
              <span className="font-medium text-slate-700">
                {AGENT_LABELS[s.agent] ?? s.agent}
              </span>
              <span className="truncate text-slate-500">
                {s.status === "running" ? "working…" : s.output}
              </span>
            </div>
          ))}
          {running && (
            <div className="flex items-center gap-2 text-slate-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300" />
              orchestrating…
            </div>
          )}
          {status === "done" && (
            <p className="pt-1 font-medium text-emerald-600">
              All agents finished.
            </p>
          )}
          {status === "error" && (
            <p className="pt-1 font-medium text-rose-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
