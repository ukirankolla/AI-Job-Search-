import Link from "next/link";
import Image from "next/image";
import { getSessionUser, isOnboarded } from "@/lib/auth";

export const metadata = {
  title: "Noventra — Your Job Search, on Autopilot",
  description:
    "Upload your resume once. Noventra's AI agents scan fresh job postings, score each one 0–100 against your skills, rewrite an ATS-friendly resume and cover letter, and submit applications on a schedule — you just review and send.",
};

const liveJobs = [
  { role: "Senior Full-Stack Engineer", company: "Stripe", location: "Remote", match: 87 },
  { role: "Product Engineer", company: "Linear", location: "Remote US", match: 91 },
  { role: "Frontend Engineer", company: "Vercel", location: "San Francisco", match: 64 },
];

const values = [
  {
    title: "Match",
    desc: "Every posting scored 0–100 against your resume.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5 7.5 9l3.5 3.5L18 5m0 0h-4m4 0v4M5 21h14" />
      </svg>
    ),
  },
  {
    title: "Tailor",
    desc: "ATS-friendly resume and cover letter per role.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 7.5 2 2M5 21l3.5-1 11-11a1.414 1.414 0 0 0-2-2l-11 11L5 21Z" />
      </svg>
    ),
  },
  {
    title: "Apply",
    desc: "Auto-submits email-ready applications on schedule.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
      </svg>
    ),
  },
];

const avatars = [
  "/hero/avatar-priya.png",
  "/hero/avatar-marcus.png",
  "/hero/avatar-elena.png",
];

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Auto-pilot", href: "#auto-pilot" },
      { label: "Pricing", href: "/upgrade" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Stories", href: "#stories" },
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export default async function Home() {
  const user = await getSessionUser();
  const onboarded = user ? await isOnboarded(user.id) : false;
  const getStartedHref = !user
    ? "/signup"
    : onboarded
      ? "/dashboard"
      : "/onboarding";
  const ctaLabel = !user
    ? "Get started free"
    : onboarded
      ? "Go to dashboard"
      : "Complete profile";

  return (
    <main className="overflow-hidden bg-[#070b17]">
      {/* ============ HERO ============ */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[56rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-20">
          <a
            href="#auto-pilot"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-3 text-xs font-medium text-slate-300 backdrop-blur transition hover:border-white/20 hover:text-white"
          >
            <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              NEW
            </span>
            Auto-pilot runs daily at 4 PM PT
          </a>

          <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Your next job, found and applied{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              on autopilot.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Upload your resume once. Noventra&apos;s agents scan fresh postings,
            score every role against your skills, rewrite your application, and
            submit it while you live your life. You just review and send.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={getStartedHref}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/40 transition hover:from-indigo-400 hover:to-violet-500"
            >
              {ctaLabel}
            </Link>
            {!user && (
              <Link
                href="/login"
                className="rounded-lg border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-white/25 hover:bg-white/10"
              >
                Sign in
              </Link>
            )}
            <a
              href="#how-it-works"
              className="px-2 text-sm font-medium text-slate-400 underline-offset-4 transition hover:text-white hover:underline"
            >
              How it works
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex -space-x-3">
              {avatars.map((a) => (
                <Image
                  key={a}
                  src={a}
                  alt=""
                  aria-hidden
                  width={96}
                  height={96}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-[#070b17]"
                />
              ))}
            </div>
            <p className="text-left text-sm leading-snug text-slate-400">
              <span className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, s) => (
                  <svg key={s} viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.29 3.96a1 1 0 0 0 .95.69h4.16c.97 0 1.37 1.24.59 1.81l-3.37 2.45a1 1 0 0 0-.36 1.12l1.28 3.96c.3.92-.75 1.69-1.54 1.12l-3.36-2.44a1 1 0 0 0-1.18 0l-3.36 2.44c-.79.57-1.84-.2-1.54-1.12l1.28-3.96a1 1 0 0 0-.36-1.12L2.06 9.39c-.78-.57-.38-1.81.6-1.81h4.15a1 1 0 0 0 .95-.69l1.29-3.96Z" />
                  </svg>
                ))}
              </span>
              Loved by <span className="font-semibold text-white">12,000+</span> job
              seekers who stopped copy-pasting resumes.
            </p>
          </div>
        </div>

        {/* Slim live-job strip */}
        <div className="relative mx-auto max-w-4xl px-4 pb-16 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120]/90 shadow-2xl shadow-indigo-950/50 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Job feed · last 8 hours
              </p>
              <p className="flex items-center gap-2 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Agent run complete
              </p>
            </div>
            <div className="grid gap-px bg-white/5 md:grid-cols-3">
              {liveJobs.map((j) => (
                <div key={j.company} className="flex items-center justify-between gap-3 bg-[#0b1120] px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{j.role}</p>
                    <p className="text-xs text-slate-400">
                      {j.company} · {j.location}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      j.match >= 85
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {j.match}%
                  </span>
                </div>
              ))}
            </div>
            <div className="h-1 w-full bg-white/10">
              <div className="h-full w-[80%] rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ VALUE STRIP ============ */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-white/5 bg-white/[0.02] py-14"
      >
        <div className="mx-auto grid max-w-5xl gap-8 px-4 text-center sm:px-6 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title}>
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300">
                {v.icon}
              </span>
              <h3 className="mt-3 text-base font-semibold text-white">{v.title}</h3>
              <p className="mx-auto mt-1 max-w-[16rem] text-sm leading-relaxed text-slate-400">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ AUTO-PILOT ============ */}
      <section id="auto-pilot" className="scroll-mt-24 border-b border-white/5 py-14">
        <div className="mx-auto grid max-w-4xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium tracking-wide text-indigo-200 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
              Auto-pilot
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Wake up to applications,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                not a blank search page.
              </span>
            </h2>
            <p className="mt-3 max-w-md text-slate-400">
              Every day at 4 PM PT the agents scan, score, and prepare
              applications while you live your life. Nothing happens blind.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={getStartedHref}
                className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/40 transition hover:from-indigo-400 hover:to-violet-500"
              >
                {ctaLabel}
              </Link>
              <Link
                href="/upgrade"
                className="rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/25 hover:bg-white/10"
              >
                Explore plans
              </Link>
            </div>
          </div>

          <ul className="grid max-w-sm gap-2.5 text-sm lg:w-72">
            <li className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1120]/60 px-4 py-3 text-slate-300">
              Stripe · Senior Full-Stack
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                Submitted
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1120]/60 px-4 py-3 text-slate-300">
              Linear · Product Engineer
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                Submitted
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1120]/60 px-4 py-3 text-slate-300">
              Figma · Frontend Engineer
              <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                Ready
              </span>
            </li>
            <li className="px-1 pt-1 text-xs text-slate-500">
              A digest email showed all of this at 4:01 PM.
            </li>
          </ul>
        </div>
      </section>

      {/* ============ STORIES ============ */}
      <section id="stories" className="scroll-mt-24 border-b border-white/5 bg-white/[0.02] py-14">
        <figure className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <div className="flex justify-center gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, s) => (
              <svg key={s} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.29 3.96a1 1 0 0 0 .95.69h4.16c.97 0 1.37 1.24.59 1.81l-3.37 2.45a1 1 0 0 0-.36 1.12l1.28 3.96c.3.92-.75 1.69-1.54 1.12l-3.36-2.44a1 1 0 0 0-1.18 0l-3.36 2.44c-.79.57-1.84-.2-1.54-1.12l1.28-3.96a1 1 0 0 0-.36-1.12L2.06 9.39c-.78-.57-.38-1.81.6-1.81h4.15a1 1 0 0 0 .95-.69l1.29-3.96Z" />
              </svg>
            ))}
          </div>
          <blockquote className="mt-4 text-xl leading-relaxed text-slate-200">
            &ldquo;The match scores are scary accurate. I uploaded my resume once and
            woke up to three tailored applications waiting for my review.&rdquo;
          </blockquote>
          <figcaption className="mt-5 flex items-center justify-center gap-3">
            <Image
              src="/hero/avatar-priya.png"
              alt="Portrait of Priya Sharma"
              width={96}
              height={96}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
            />
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Priya Sharma</p>
              <p className="text-xs text-slate-500">Product Designer · Toronto</p>
            </div>
          </figcaption>
        </figure>
      </section>

      {/* ============ CTA ============ */}
      <section className="px-4 py-16 sm:px-6">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-16">
          <Image
            src="/hero/interview.png"
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 896px) 56rem, 100vw"
            className="object-cover opacity-25"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-[#070b17]/80 via-[#0a1124]/70 to-[#070b17]/90"
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Stop pasting the same resume into{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                every application.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              Upload once. Read the digest. Click send. Repeat.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={getStartedHref}
                className="rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-xl transition hover:bg-slate-200"
              >
                {ctaLabel}
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="rounded-lg border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10"
                >
                  Sign in
                </Link>
              )}
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Free plan — 15 rewrites &amp; applies per week, no card required.
            </p>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/5 bg-[#05070f]">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                  N
                </span>
                <span className="text-lg font-semibold tracking-tight text-white">
                  Noventra
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
                Resume-first AI job search. Upload once and let the agents do the rest.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-10">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <h4 className="text-sm font-semibold text-white">{col.title}</h4>
                  <ul className="mt-3 space-y-2">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="text-sm text-slate-400 transition hover:text-white"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Noventra. Resume-first AI job search.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}