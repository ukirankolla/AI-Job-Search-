import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export const metadata = {
  title: "Noventra — Upload Your Resume, We Do the Rest",
  description:
    "Upload your resume once. Noventra's AI agents match fresh job postings, rewrite your ATS-friendly resume and cover letter, and prep you for interviews.",
};

const steps = [
  {
    num: "01",
    title: "Discover",
    desc: "Fresh postings are pulled automatically from company career portals and LinkedIn — every hour. No aggregator spam, official sources only.",
  },
  {
    num: "02",
    title: "Match",
    desc: "Every job is scored 0–100 against your resume with the matched and missing skills called out, so you know where you stand before you apply.",
  },
  {
    num: "03",
    title: "Tailor",
    desc: "For any role you like, the agents rewrite an ATS-friendly resume and draft a cover letter that closes the gap to the exact posting.",
  },
  {
    num: "04",
    title: "Apply",
    desc: "One click opens the official application page with your tailored documents ready — no bot submissions, full control in your hands.",
  },
];

const agents = [
  {
    name: "Matcher",
    desc: "Scores fresh job postings against your resume and surfaces skill gaps.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5 7.5 9l3.5 3.5L18 5m0 0h-4m4 0v4" />
        <path strokeLinecap="round" d="M5 21h14" />
      </svg>
    ),
  },
  {
    name: "Tailor",
    desc: "Rewrites your resume and cover letter for each specific role.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 7.5 2 2M5 21l3.5-1 11-11a1.414 1.414 0 0 0-2-2l-11 11L5 21Z" />
      </svg>
    ),
  },
  {
    name: "Prep",
    desc: "Generates role-specific interview questions with model answers.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5m0 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6 5a4.5 4.5 0 0 0-12 0" />
      </svg>
    ),
  },
  {
    name: "Tracker",
    desc: "Watches deadlines and pushes you to follow up at the right time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10a9 9 0 1 0 18 0 9 9 0 0 0-18 0Zm9 0v4m0-4h4m-4 0H8" />
      </svg>
    ),
  },
];

const stats = [
  { value: "4", label: "AI agents working together" },
  { value: "0–100", label: "Match score on every job" },
  { value: "15", label: "Free rewrites & applies per week" },
  { value: "1", label: "Resume upload to get started" },
];

export default async function Home() {
  const user = await getSessionUser();
  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Go to dashboard" : "Get started free";

  return (
    <main className="overflow-hidden">
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgb(99 102 241 / 0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Multi-agent AI job search
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Upload your resume once.
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                We can take care of the rest.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
              Noventra&apos;s AI agents scan fresh job postings, match them to
              your skills with a clear score, rewrite your resume and cover
              letter for each role, and prep you for the interview — so you just
              apply.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={ctaHref}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-500"
              >
                {ctaLabel}
              </Link>
              <a
                href="#how-it-works"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
              <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-slate-400">
                  noventra.app/jobs
                </span>
              </div>

              <div className="grid gap-0 sm:grid-cols-5">
                <div className="sm:col-span-3 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      Job feed
                    </p>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                      last 8 hours
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            Senior Full-Stack Engineer
                          </p>
                          <p className="text-sm text-slate-500">
                            Stripe · Remote
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                          Match 87%
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                          Full-time
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                          Sponsorship available
                        </span>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
                          Company site
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            Frontend Engineer, Platform
                          </p>
                          <p className="text-sm text-slate-500">
                            Vercel · San Francisco
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                          Match 64%
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                          Full-time
                        </span>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
                          LinkedIn
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-900 p-5 text-white sm:col-span-2 sm:border-l sm:border-t-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Agent run
                  </p>
                  <div className="mt-4 space-y-3 text-sm">
                    {[
                      { label: "Scored 12 fresh postings", state: "done" },
                      { label: "Rewrote resume for Stripe", state: "done" },
                      { label: "Drafted cover letter", state: "done" },
                      { label: "Prepped interview questions", state: "active" },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${
                            s.state === "done"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-indigo-500/20 text-indigo-300"
                          }`}
                        >
                          {s.state === "done" ? "✓" : "…"}
                        </span>
                        <span className="text-slate-200">{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={ctaHref}
                    className="mt-6 block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    Tailor & apply →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="order-2 mt-1 text-sm text-slate-500">
                  {s.label}
                </dt>
                <dd className="order-1 text-3xl font-bold tracking-tight text-slate-900">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From resume to application, end to end
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-6"
              >
                <span className="text-sm font-semibold text-indigo-600">
                  Step {s.num}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute right-4 top-6 hidden text-slate-300 lg:block"
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            The agents
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            A team of agents, working your search
          </h2>
          <p className="mt-4 text-slate-500">
            Each run streams live in your browser, and the results are saved to
            your pipeline automatically.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => (
            <div
              key={a.name}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                {a.icon}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{a.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 text-center sm:px-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Stop pasting the same resume into every application.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Upload once, and let the agents match, tailor, and prep every role
            for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ctaHref}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              {ctaLabel}
            </Link>
            {!user && (
              <a
                href="/login"
                className="rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
              >
                Sign in
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-sm text-white">
              N
            </span>
            <span>Noventra</span>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Noventra. Resume-first AI job search.
          </p>
        </div>
      </footer>
    </main>
  );
}
