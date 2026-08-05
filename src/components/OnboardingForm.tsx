"use client";

import { useActionState } from "react";
import {
  completeOnboarding,
  initialState,
} from "@/app/actions/onboarding";
import type { Profile } from "@/lib/types";

const COMMON_COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "India",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Ireland",
  "Singapore",
  "United Arab Emirates",
  "Brazil",
  "Mexico",
  "Japan",
  "South Korea",
];

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function OnboardingForm({
  profile,
  email,
  next,
}: {
  profile: Profile;
  email?: string;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initialState,
  );

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8">
      <h1 className="text-xl font-semibold text-slate-900">
        Welcome to Noventra
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Tell us a bit about yourself so we can tailor job matching and
        applications for you.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className={labelClass}>Email</label>
          <input
            name="email"
            type="email"
            defaultValue={profile.email || email}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Full name</label>
          <input
            name="full_name"
            defaultValue={profile.full_name}
            placeholder="Jane Doe"
            required
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={profile.phone}
              placeholder="+1 555 000 1234"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input
              name="country"
              list="countries"
              defaultValue={profile.country}
              placeholder="United States"
              className={inputClass}
            />
            <datalist id="countries">
              {COMMON_COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input
            name="city"
            defaultValue={profile.city}
            placeholder="Austin, TX"
            className={inputClass}
          />
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">
            Optional links — used on your tailored resume.
          </p>
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input
              name="linkedin_url"
              type="url"
              defaultValue={profile.linkedin_url}
              placeholder="https://www.linkedin.com/in/..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>GitHub</label>
            <input
              name="github_url"
              type="url"
              defaultValue={profile.github_url}
              placeholder="https://github.com/..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Website / portfolio</label>
            <input
              name="website_url"
              type="url"
              defaultValue={profile.website_url}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>

        <input type="hidden" name="next" value={next ?? "/dashboard"} />

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Continue to dashboard →"}
        </button>
        {state.ok && (
          <p className="text-sm text-emerald-600">{state.message}</p>
        )}
        {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      </form>
    </div>
  );
}
