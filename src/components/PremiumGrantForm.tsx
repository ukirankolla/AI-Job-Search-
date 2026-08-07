"use client";

import { useActionState, useState } from "react";
import { initialState } from "@/app/actions/form-state";
import { grantPremium } from "@/app/actions/subscription";

export function PremiumGrantForm() {
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(
    grantPremium,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-slate-900">Grant premium (admin)</h2>
      <p className="mt-1 text-sm text-slate-500">
        Manually activate premium for a user by email.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {pending ? "Granting…" : "Grant premium"}
        </button>
      </div>
      {state.ok && state.granted && (
        <p className="mt-2 text-sm text-emerald-700">
          {state.granted} is now premium.
        </p>
      )}
      {!state.ok && state.message && (
        <p className="mt-2 text-sm text-rose-600">{state.message}</p>
      )}
    </form>
  );
}
