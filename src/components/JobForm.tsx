"use client";

import { useActionState } from "react";
import { addManualJob } from "@/app/actions/applications";
import { initialState } from "@/app/actions/form-state";

export function JobForm() {
  const [state, formAction, pending] = useActionState(addManualJob, initialState);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold">Add a job manually</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="title"
          placeholder="Job title *"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="company"
          placeholder="Company *"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="location"
          placeholder="Location / Remote"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="deadline"
          type="date"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        name="description"
        placeholder="Job description *"
        required
        rows={5}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="url"
        placeholder="Application URL"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add job"}
      </button>
      {state.ok && <p className="text-sm text-emerald-600">{state.message}</p>}
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
    </form>
  );
}
