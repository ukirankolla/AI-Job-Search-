"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteApplication,
  initialState,
} from "@/app/actions/applications";

export function DeleteApplicationButton({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    deleteApplication,
    initialState,
  );

  useEffect(() => {
    if (state.ok) router.replace("/applications");
  }, [state.ok, router]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("Remove this application from your pipeline?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={applicationId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-rose-300 px-3 py-1.5 text-sm text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-rose-600">{state.error}</span>
      )}
    </form>
  );
}
