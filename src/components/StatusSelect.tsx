"use client";

import { useActionState, useState } from "react";
import { updateApplicationStatus } from "@/app/actions/applications";
import { initialState } from "@/app/actions/form-state";
import type { ApplicationStatus } from "@/lib/types";

const statuses: ApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

export function StatusSelect({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState(
    updateApplicationStatus,
    initialState,
  );
  const [value, setValue] = useState("");

  return (
    <form
      action={formAction}
      className="flex items-center gap-2"
      onSubmit={() => {
        setTimeout(() => setValue(""), 400);
      }}
    >
      <input type="hidden" name="id" value={applicationId} />
      <select
        name="status"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
      >
        <option value="">Move to…</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {value && (
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "…" : "Update"}
        </button>
      )}
      {state.ok && <span className="text-xs text-emerald-600">✓</span>}
    </form>
  );
}
