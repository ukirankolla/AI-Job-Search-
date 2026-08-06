"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { deleteJob } from "@/app/actions/jobs";
import { initialState } from "@/app/actions/form-state";

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(deleteJob, initialState);

  useEffect(() => {
    if (state.ok) router.replace("/jobs");
  }, [state.ok, router]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Delete this job? It is shared, so it will disappear for everyone.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={jobId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-rose-600 underline underline-offset-2 transition hover:text-rose-700 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete job"}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-rose-600">{state.error}</span>
      )}
    </form>
  );
}
