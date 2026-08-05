"use client";

import { useActionState } from "react";
import {
  createApplication,
  initialState,
} from "@/app/actions/applications";

export function AddToPipelineButton({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(
    createApplication,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="job_id" value={jobId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
      >
        {pending ? "Adding…" : "+ Pipeline"}
      </button>
      {state.ok && (
        <span className="text-xs text-emerald-600">{state.message}</span>
      )}
      {state.error && (
        <span className="text-xs text-rose-600">{state.error}</span>
      )}
    </form>
  );
}
