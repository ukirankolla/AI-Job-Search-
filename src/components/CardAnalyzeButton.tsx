"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseSseBuffer, parseSseEvent } from "@/lib/sse";

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
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setStatus("running");
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
        if (event === "done") {
          setStatus("done");
          router.refresh();
          return;
        }
        if (event === "error") {
          let data: unknown;
          try {
            data = JSON.parse(raw);
          } catch {
            data = {};
          }
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

  return (
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
      {status === "error" && (
        <span
          className="text-xs text-rose-600"
          title={error ?? "Analysis failed"}
        >
          ✗
        </span>
      )}
    </div>
  );
}
