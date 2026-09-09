import Link from "next/link";
import Image from "next/image";
import { getSessionUser, isOnboarded } from "@/lib/auth";

export const metadata = {
  title: "Noventra — Your Job Search, on Autopilot",
  description:
    "Upload your resume once. Noventra's AI agents scan fresh job postings, score each one 0–100 against your skills, rewrite an ATS-friendly resume and cover letter, and submit applications on a schedule — you just review and send.",
};

const companies = [
  "Stripe",
  "Vercel",
  "Linear",
  "Figma",
  "Notion",
  "Shopify",
  "Airbnb",
  "Coinbase",
  "Datadog",
  "Rippling",
];

const jobFeed = [
  {
    role: "Senior Full-Stack Engineer",
    company: "Stripe",
    location: "Remote",
    tags: ["Full-time", "Top 25 salary band"],
    match: 87,
    source: "Company site",
  },
  {
    role: "Product Engineer",
    company: "Linear",
    location: "Remote · US",
    tags: ["Full-time", "Backend + AI"],
    match: 91,
    source: "Company site",
  },
  {
    role: "Frontend Engineer, Platform",
    company: "Vercel",
    location: "San Francisco",
    tags: ["Full-time", "Edge infra"],
    match: 64,
    source: "LinkedIn",
  },
];

const agentRun = [
  { label: "Scanned 12 fresh postings", state: "done" },
  { label: "Matched Stripe · Senior Full-Stack — 87%", state: "done" },
  { label: "Rewrote resume for Stripe role", state: "done" },
  { label: "Drafted cover letter", state: "done" },
  { label: "Prepping interview questions", state: "active" },
];

const steps = [
  {
    num: "01",
    title: "Discover",
    desc: "Fresh postings are pulled from company career portals and LinkedIn every hour. Official sources only — no aggregator spam.",
  },
  {
    num: "02",
    title: "Match",
    desc: "Every job is scored 0–100 against your resume with matched and missing skills called out before you apply.",
  },
  {
    num: "03",
    title: "Tailor",
    desc: "Agents rewrite an ATS-friendly resume and draft a cover letter that closes the gap to the exact posting.",
  },
  {
    num: "04",
    title: "Apply",
    desc: "Email-ready postings go out on your behalf; portal postings queue up one-tap-ready with your documents attached.",
  },
];

const agents = [
  {
    name: "Matcher",
    role: "Scoring & skill gaps",
    desc: "Scores fresh job postings against your resume and surfaces the exact skills you're missing.",
    accent: "from-indigo-500 to-indigo-600",
  },
  {
    name: "Tailor",
    role: "Documents",
    desc: "Rewrites your resume and cover letter for each specific role, ATS-optimized.",
    accent: "from-violet-500 to-violet-600",
  },
  {
    name: "Prep",
    role: "Interview readiness",
    desc: "Generates role-specific interview questions with model answers so you walk in ready.",
    accent: "from-fuchsia-500 to-fuchsia-600",
  },
  {
    name: "Tracker",
    role: "Follow-up timing",
    desc: "Watches deadlines and nudges you to follow up at exactly the right moment.",
    accent: "from-emerald-500 to-emerald-600",
  },
];

const testimonials = [
  {
    quote:
      "I uploaded my resume once and woke up to three tailored applications waiting for my review. The match scores are scary accurate.",
    name: "Priya Sharma",
    role: "Product Designer · Toronto",
    avatar: "/hero/avatar-priya.png",
  },
  {
    quote:
      "The skill-gap breakdown told me exactly what to learn. Two months later I had an offer at 22% more than my old job.",
    name: "Marcus Johnson",
    role: "Frontend Engineer · Atlanta",
    avatar: "/hero/avatar-marcus.png",
  },
  {
    quote:
      "Auto-pilot applied while I was at work and emailed me a digest every evening. I only clicked submit on the ones I actually liked.",
    name: "Elena Ramirez",
    role: "Senior Data Analyst · Austin",
    avatar: "/hero/avatar-elena.png",
  },
  {
    quote:
      "The interview prep questions were almost word-for-word what they asked me on the day. That is not luck — that is preparation.",
    name: "Daniel Park",
    role: "Operations Manager · Seattle",
    avatar: "/hero/avatar-daniel.png",
  },
];

const stats = [
  { value: "4", label: "AI agents work your search" },
  { value: "0–100", label: "Match score on every job" },
  { value: "15", label: "Free rewrites & applies per week" },
  { value: "1", label: "Resume upload to get started" },
];

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Agents", href: "#agents" },
      { label: "Auto-pilot", href: "#auto-pilot" },
      { label: "Pricing", href: "/upgrade" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Success stories", href: "#stories" },
      { label: "Match score guide", href: "#how-it-works" },
      { label: "Skill gap analysis", href: "#how-it-works" },
      { label: "Interview prep", href: "#agents" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
];

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium tracking-wide text-indigo-200 backdrop-blur">
      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
      {children}
    </span>
  );
}

function SectionTitle({
  tag,
  title,
  sub,
}: {
  tag: string;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium tracking-wide text-indigo-200 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
        {tag}
      </span>
      <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {sub && (
        <p className="mt-4 text-base leading-relaxed text-slate-400">{sub}</p>
      )}
    </div>
  );
}

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
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-40 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
          <div>
            <a
              href="#auto-pilot"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-3 text-xs font-medium text-slate-300 backdrop-blur transition hover:border-white/20 hover:text-white"
            >
              <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                NEW
              </span>
              Auto-pilot now runs daily at 4 PM PT
              <span aria-hidden className="text-slate-500">→</span>
            </a>

            <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your next job, found and applied{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                on autopilot.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              Upload your resume once. Noventra&apos;s agents scan fresh
              postings, score every role 0–100 against your skills, rewrite an
              ATS-friendly resume and cover letter, and submit applications
              while you live your life. You just review and send.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
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
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-4">
              <div className="flex -space-x-3">
                {testimonials.map((t) => (
                  <Image
                    key={t.name}
                    src={t.avatar}
                    alt=""
                    aria-hidden
                    width={96}
                    height={96}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[#070b17]"
                  />
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.29 3.96a1 1 0 0 0 .95.69h4.16c.97 0 1.37 1.24.59 1.81l-3.37 2.45a1 1 0 0 0-.36 1.12l1.28 3.96c.3.92-.75 1.69-1.54 1.12l-3.36-2.44a1 1 0 0 0-1.18 0l-3.36 2.44c-.79.57-1.84-.2-1.54-1.12l1.28-3.96a1 1 0 0 0-.36-1.12L2.06 9.39c-.78-.57-.38-1.81.6-1.81h4.15a1 1 0 0 0 .95-.69l1.29-3.96Z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-1 text-slate-400">
                  Loved by <span className="font-semibold text-white">12,000+</span>{" "}
                  job seekers who stopped copy-pasting resumes.
                </p>
              </div>
            </div>
          </div>

          {/* Hero product mockup */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120]/90 shadow-2xl shadow-indigo-950/50 backdrop-blur">
              <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-500/70" />
                <span className="h-3 w-3 rounded-full bg-amber-500/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
                <span className="ml-3 flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  noventra.app/jobs
                </span>
                <span className="ml-auto rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  Live run
                </span>
              </div>

              <div className="grid gap-px bg-white/5 sm:grid-cols-5">
                <div className="bg-[#0b1120] p-5 sm:col-span-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Job feed
                    </p>
                    <span className="text-[11px] text-slate-500">last 8 hours</span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {jobFeed.map((j) => (
                      <div
                        key={j.company}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{j.role}</p>
                            <p className="mt-0.5 text-xs text-slate-400">
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
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {j.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-400"
                            >
                              {t}
                            </span>
                          ))}
                          <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                            {j.source}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[#0a0e1a] p-5 sm:border-l sm:border-t-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Agent run
                  </p>
                  <div className="mt-4 space-y-3">
                    {agentRun.map((s) => (
                      <div key={s.label} className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                            s.state === "done"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-indigo-500/20 text-indigo-300"
                          }`}
                        >
                          {s.state === "done" ? "✓" : "…"}
                        </span>
                        <span className="text-xs leading-tight text-slate-300">
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[80%] animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      80% complete · prep agent running
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 -top-5 animate-float-sm rounded-xl border border-white/10 bg-[#0b1120]/95 px-4 py-3 shadow-xl shadow-indigo-950/40 backdrop-blur sm:-right-8">
              <p className="text-[11px] font-medium text-slate-400">Match score</p>
              <p className="text-sm font-bold text-white">
                <span className="text-emerald-400">87%</span> · Senior Engineer
              </p>
            </div>

            <div className="absolute -bottom-6 -left-3 animate-float rounded-xl border border-white/10 bg-[#0b1120]/95 px-4 py-3 shadow-xl shadow-indigo-950/40 backdrop-blur sm:-left-8">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                  N
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Auto-pilot ran today
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    2 applied · 3 ready to send
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ LOGO / TRUST BAR ============ */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Scoring and tailoring against fresh postings from
        </p>
        <div className="relative mx-auto mt-8 max-w-5xl overflow-hidden px-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#070b17] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#070b17] to-transparent" />
          <div className="flex w-max animate-marquee gap-14 pr-14">
            {[...companies, ...companies].map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="whitespace-nowrap text-lg font-semibold tracking-tight text-slate-500 transition hover:text-slate-300"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="border-b border-white/5">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-16 sm:px-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <dd className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                {s.value}
              </dd>
              <dt className="mt-2 text-sm text-slate-400">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-b border-white/5 bg-white/[0.02]"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionTitle
            tag="How it works"
            title={
              <>
                From resume to application,{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  end to end.
                </span>
              </>
            }
            sub="Four steps, zero copy-pasting. The agents do the matching work so you only ever review and send."
          />

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className="group relative rounded-2xl border border-white/10 bg-[#0b1120]/60 p-6 transition hover:border-indigo-400/30 hover:bg-[#0b1120]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-indigo-400">
                    Step {s.num}
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-sm text-indigo-300 transition group-hover:from-indigo-500 group-hover:to-violet-600 group-hover:text-white">
                    {i === 0 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                      </svg>
                    )}
                    {i === 1 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5 7.5 9l3.5 3.5L18 5m0 0h-4m4 0v4M5 21h14" />
                      </svg>
                    )}
                    {i === 2 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 7.5 2 2M5 21l3.5-1 11-11a1.414 1.414 0 0 0-2-2l-11 11L5 21Z" />
                      </svg>
                    )}
                    {i === 3 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AGENTS ============ */}
      <section id="agents" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionTitle
            tag="The agents"
            title={
              <>
                A team of agents,{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  working your search.
                </span>
              </>
            }
            sub="Each agent owns one job. Together they turn one resume upload into a pipeline of applied, tailored applications."
          />

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((a) => (
              <div
                key={a.name}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120]/60 p-6 transition hover:border-white/20"
              >
                <div
                  aria-hidden
                  className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${a.accent} opacity-0 blur-3xl transition duration-500 group-hover:opacity-25`}
                />
                <span
                  className={`relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${a.accent} text-white shadow-lg`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.3 24.3 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-1.687C2.05 18.02 1.57 16.008 2.598 14.7L5 14.5" />
                  </svg>
                </span>
                <h3 className="relative mt-5 text-lg font-semibold text-white">{a.name}</h3>
                <p className="relative text-xs font-medium text-slate-500">{a.role}</p>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AUTO-PILOT ============ */}
      <section
        id="auto-pilot"
        className="scroll-mt-24 border-y border-white/5 bg-white/[0.02]"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionTag>Auto-pilot</SectionTag>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Wake up to applications,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                not a blank search page.
              </span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-400">
              Turn on auto-pilot and the agents run on a schedule — matching,
              tailoring, and submitting while you are at work, at the gym, or
              asleep.
            </p>

            <div className="mt-8 space-y-5">
              {[
                {
                  title: "Runs while you live your life",
                  desc: "Every day at 4 PM PT, the pilot scans everything posted in the last 24 hours and scores it against your resume.",
                },
                {
                  title: "Submits what it can, preps the rest",
                  desc: "Email-ready postings go out on your behalf with tailored documents attached. Portal postings queue one-tap-ready.",
                },
                {
                  title: "A digest in your inbox",
                  desc: "One email tells you exactly what was applied for you and what just needs a click — nothing happens blind.",
                },
              ].map((p) => (
                <div key={p.title} className="flex gap-4">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-white">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
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

          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/10 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-indigo-950/50">
              <Image
                src="/hero/desk.png"
                alt="A tidy home-office desk at golden hour with an open laptop running Noventra"
                width={1600}
                height={900}
                sizes="(min-width: 1024px) 36rem, 100vw"
                className="h-[24rem] w-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b17] via-[#070b17]/40 to-transparent" />

              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-[#0b1120]/90 p-5 shadow-xl backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                    N
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Noventra Auto-pilot
                    </p>
                    <p className="text-xs text-slate-400">Today, 4:00 PM PT</p>
                  </div>
                  <span className="ml-auto rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    ● On
                  </span>
                </div>

                <p className="mt-3 rounded-lg bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200">
                  Auto-pilot: 2 applied, 3 ready to send
                </p>

                <ul className="mt-3 space-y-2 text-xs">
                  <li className="flex items-center justify-between gap-2 text-slate-300">
                    <span>Senior Full-Stack Eng · Stripe</span>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">
                      Submitted
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-2 text-slate-300">
                    <span>Product Engineer · Linear</span>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">
                      Submitted
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-2 text-slate-300">
                    <span>Frontend Eng · Figma</span>
                    <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 font-semibold text-indigo-300">
                      Ready — one tap
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section id="stories" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionTitle
            tag="Success stories"
            title={
              <>
                Real people.{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Real interviews.
                </span>
              </>
            }
            sub="Job seekers who stopped copy-pasting resumes and let the agents do the heavy lifting."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0b1120]/60 p-6 transition hover:border-white/20 hover:bg-[#0b1120]"
              >
                <div className="flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.29 3.96a1 1 0 0 0 .95.69h4.16c.97 0 1.37 1.24.59 1.81l-3.37 2.45a1 1 0 0 0-.36 1.12l1.28 3.96c.3.92-.75 1.69-1.54 1.12l-3.36-2.44a1 1 0 0 0-1.18 0l-3.36 2.44c-.79.57-1.84-.2-1.54-1.12l1.28-3.96a1 1 0 0 0-.36-1.12L2.06 9.39c-.78-.57-.38-1.81.6-1.81h4.15a1 1 0 0 0 .95-.69l1.29-3.96Z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                  <Image
                    src={t.avatar}
                    alt={`Portrait of ${t.name}`}
                    width={96}
                    height={96}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="border-t border-white/5 bg-white/[0.02] px-4 py-20 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-16">
          <Image
            src="/hero/interview.png"
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1280px) 80rem, 100vw"
            className="object-cover opacity-25"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-[#070b17]/80 via-[#0a1124]/70 to-[#070b17]/90"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl"
          />

          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Stop pasting the same resume into{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                every application.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
              Upload once, and let the agents match, tailor, and prep every role
              for you. Read the digest. Click send. Repeat.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(2,1fr)_1fr]">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                  N
                </span>
                <span className="text-lg font-semibold tracking-tight text-white">
                  Noventra
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
                Resume-first AI job search. Upload once and let the agents
                match, tailor, and prep every role for you.
              </p>
              <div className="mt-6 flex gap-2.5">
                {["X", "in", "GH"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    aria-label={`Noventra on ${s}`}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:text-white"
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
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

          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 sm:flex-row">
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