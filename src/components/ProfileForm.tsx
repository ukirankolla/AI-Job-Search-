"use client";

import { useActionState } from "react";
import { initialState } from "@/app/actions/form-state";
import { updateProfile, uploadResumeFile } from "@/app/actions/profile";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );
  const [fileState, fileAction, filePending] = useActionState(
    uploadResumeFile,
    initialState,
  );

  return (
    <div className="space-y-8">
      <form
        key={profile.updated_at}
        action={formAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Profile</h2>
        <div>
          <label className="text-sm font-medium text-slate-700">Full name</label>
          <input
            name="full_name"
            defaultValue={profile.full_name}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Headline</label>
          <input
            name="title"
            defaultValue={profile.title}
            placeholder="Senior Full-Stack Engineer"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Summary</label>
          <textarea
            name="summary"
            defaultValue={profile.summary}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={profile.email}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={profile.phone}
              placeholder="+1 555 000 1234"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Country
            </label>
            <input
              name="country"
              defaultValue={profile.country}
              placeholder="United States"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">City</label>
            <input
              name="city"
              defaultValue={profile.city}
              placeholder="Austin, TX"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              LinkedIn URL
            </label>
            <input
              name="linkedin_url"
              type="url"
              defaultValue={profile.linkedin_url}
              placeholder="https://www.linkedin.com/in/..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              GitHub URL
            </label>
            <input
              name="github_url"
              type="url"
              defaultValue={profile.github_url}
              placeholder="https://github.com/..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Website / portfolio
            </label>
            <input
              name="website_url"
              type="url"
              defaultValue={profile.website_url}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
        {state.ok && <p className="text-sm text-emerald-600">{state.message}</p>}
        {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      </form>

      <form
        key={profile.resume_text}
        action={fileAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Resume</h2>
        <div className="space-y-2 rounded-md border border-dashed border-slate-300 p-4">
          <p className="text-sm font-medium text-slate-700">
            Upload your resume file
          </p>
          <p className="text-xs text-slate-500">
            PDF, Word (.docx), or plain text (.txt). The text is extracted and
            indexed automatically — it powers your match % and the tailor and
            prep agents for every job.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              name="resume_file"
              accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                if (e.target.files?.length) e.currentTarget.form?.requestSubmit();
              }}
              disabled={filePending}
              className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500 disabled:opacity-50"
            />
            <button type="submit" className="hidden" aria-hidden="true" />
            {profile.resume_file_path ? (
              <a
                href="/api/profile/resume"
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-full truncate text-sm font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500"
                title="Open resume document"
              >
                {profile.resume_filename ?? "Resume"}
              </a>
            ) : (
              <span className="text-xs text-slate-400">No file chosen</span>
            )}
            <span className="text-xs text-slate-400">max 50 MB</span>
          </div>
          {filePending && (
            <p className="text-sm text-slate-500">Uploading…</p>
          )}
          {fileState.ok && (
            <p className="text-sm text-emerald-600">{fileState.message}</p>
          )}
          {fileState.error && (
            <p className="text-sm text-rose-600">{fileState.error}</p>
          )}
        </div>
      </form>
    </div>
  );
}
