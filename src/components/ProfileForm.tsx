"use client";

import { useActionState } from "react";
import {
  initialState,
  updateProfile,
  uploadResume,
} from "@/app/actions/profile";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );
  const [resumeState, resumeAction, resumePending] = useActionState(
    uploadResume,
    initialState,
  );

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div>
          <label className="text-sm font-medium text-slate-700">Full name</label>
          <input
            name="full_name"
            defaultValue={profile.full_name}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Headline</label>
          <input
            name="title"
            defaultValue={profile.title}
            placeholder="Senior Full-Stack Engineer"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Summary</label>
          <textarea
            name="summary"
            defaultValue={profile.summary}
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Skills <span className="text-slate-400">(comma separated)</span>
          </label>
          <input
            name="skills"
            defaultValue={profile.skills.join(", ")}
            placeholder="TypeScript, React, Node.js, PostgreSQL"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
        {state.ok && <p className="text-sm text-emerald-600">{state.message}</p>}
        {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      </form>

      <form action={resumeAction} className="space-y-4 rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">Resume</h2>
        <p className="text-sm text-slate-500">
          Paste your resume text. The agents index it into a vector database for
          retrieval-augmented matching.
        </p>
        <textarea
          name="resume_text"
          defaultValue={profile.resume_text}
          rows={12}
          placeholder="John Doe\nFull-Stack Engineer\n...paste your resume here..."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={resumePending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {resumePending ? "Indexing…" : "Upload & vectorize"}
          </button>
          <span className="text-xs text-slate-400">
            status: {profile.resume_embedding_status}
          </span>
        </div>
        {resumeState.ok && (
          <p className="text-sm text-emerald-600">{resumeState.message}</p>
        )}
        {resumeState.error && (
          <p className="text-sm text-rose-600">{resumeState.error}</p>
        )}
      </form>
    </div>
  );
}
