# Noventra

> A resume-first, AI job-search copilot. Upload your resume **once**, and a
> team of collaborating AI agents matches fresh job postings to your skills,
> shows a match percentage for every job, rewrites an ATS-friendly resume and
> cover letter, and gets you to the official application page — one click away
> from applying.

Built with **Next.js 16** (App Router), **Supabase** (Postgres + Auth +
pgvector), and **LangChain / LangGraph**.

---

## What this repo is

Noventra is a full-stack web app that turns an uploaded resume into an
automated job-hunting workflow:

1. **Discover** — fresh job postings are pulled automatically (or on demand)
   from real company career portals. Only postings whose apply links go
   directly to a company career site or LinkedIn are kept — third-party
   aggregator/board links (Indeed, Glassdoor, Monster, etc.) are filtered out.
2. **Score** — every posting is matched against your resume, producing a
   0–100 **Match %** with matched/missing skills.
3. **Tailor** — for a specific job, the agents rewrite your resume and draft a
   cover letter to fit the posting (ATS-friendly).
4. **Prep** — role-specific interview questions with model answers.
5. **Apply** — one click opens the official application page with your tailored
   documents ready (semi-automatic by design — no bot submissions).
6. **Track** — pipeline activity generates follow-up tasks and reminders.

It includes auth, onboarding, a kanban pipeline, notifications, an AI-agent
streaming pipeline, and a free/premium quota system.

---

## End-to-end user flow

```
Sign up → Onboarding (contact details)
   → Upload resume (chunked + embedded into pgvector)
   → Browse /jobs feed  (last-8-hours default, filters: employment type,
                          sponsorship, Company/LinkedIn only, Match %)
   → Open a job → Match % + Agents (Analyze / Tailor+prep / Prep)
   → Rewrite resume for this job (counts against weekly quota)
   → Apply now → opens official company/LinkedIn posting (counts against quota)
   → Job appears in /applications pipeline
   → Tracker (daily cron) creates follow-up reminders
   → /upgrade shows weekly usage; admins grant premium manually
```

- **New users** must complete onboarding (email, name, phone, country, city,
  LinkedIn/GitHub/website) before the dashboard, jobs, or pipeline load.
- **Free accounts** get **15 resume rewrites + 15 in-app applies** per rolling
  7 days. Premium ($15/mo) and admin accounts are unlimited.

---

## Features

**Job discovery**
- Pulls the last 8 hours (configurable 1–72h) of postings from a company's
  public **Greenhouse**, **Lever**, **Workable**, or **Ashby** job board — no
  API keys needed. A deterministic **mock** source is the default when none is
  set.
- **Direct-source only**: every apply URL is classified (`company` /
  `linkedin` / `board` / `unknown`); aggregator links are rejected at ingest.
- Hourly discovery via cron (`/api/cron/jobs`), plus on-demand discovery
  (`POST /api/jobs/discover`), both deduplicated by `source + external_id`.
- Manual add / CSV import still supported through the shared ingest pipeline.

**Job feed (`/jobs`)**
- Time window: **All / 12h / 8h / 4h** (8h default).
- **Employment type** checkboxes: W2, C2C, Full-time, Internship.
- **Sponsorship** toggle: Yes / No.
- **"Company / LinkedIn only"** toggle (on by default).
- **Match %** pill per job (green ≥70, amber 40–69, red <40) and a
  "Match all with my resume" button.
- Source badge (e.g. Greenhouse) and job detail page with the full description.

**AI agents** (streamed live via SSE)
- **Matcher** — scores the job 0–100 against your profile + RAG-retrieved
  resume chunks; lists matched/missing skills, strengths, and concerns.
- **Tailor** — rewrites your resume and writes a cover letter for the exact role.
- **Prep** — generates interview questions with model answers and tips.
- **Tracker** — turns pipeline events into follow-up tasks/reminders (daily cron).

**Resume & apply**
- Resume-first onboarding + RAG (chunk → embed → retrieve relevant sections).
- **Update resume for this job** — one-button ATS-friendly rewrite with a
  copy-ready preview (counts against the weekly rewrite quota).
- **Apply now / Auto-apply** — one click opens the official company or LinkedIn
  application page (counts against the weekly apply quota).

**Plans & admin**
- Free / premium tiers with server-side quota enforcement (`usage_events`
  table), weekly usage meter on `/upgrade`, and a **grant premium** form
  available only to admins (env allowlist `ADMIN_EMAILS`).

**Platform**
- Magic-link + Google sign-in; Next.js proxy route protection; kanban pipeline
  board (Saved / Applied / Interviewing / Offer / Rejected); notifications
  inbox; SEO'd marketing landing page.
- **Installable PWA** — a web manifest (`app/manifest.ts`), generated icons
  (`npm run icons` → `public/icons/`), and a service worker (`public/sw.js`)
  make Noventra installable: Android/Chrome users get an **Install** prompt,
  iOS users **Add to Home Screen**. Static assets are cached for offline use.
- **Native mobile app** — an Expo (React Native) app in `mobile/` wraps the web
  app in a WebView so the same product can ship to the Apple App Store and
  Google Play. External links open in the system browser; in-app back/forward/
  reload controls keep the browsing experience native-feeling. See
  `mobile/README.md` for build and store-submission instructions.

---

## The AI agents (LangGraph)

Each "Run" is a small stateful graph streamed to the browser as Server-Sent
Events. Steps update in real time and results are persisted.

```
runType: "analyze"   matcher ──► done
runType: "apply"     matcher ──► tailor (resume + cover letter) ──► prep ──► done
runType: "prep"      matcher ──► tailor ──► prep ──► done
```

| Agent | Node | What it produces |
| --- | --- | --- |
| Retriever | RAG | Pulls the most relevant resume chunks for the job |
| Matcher | `matcherNode` | `MatchResult`: score, matched/missing skills, strengths, concerns |
| Tailor | `tailorNode` | `TailorResult`: rewritten resume + cover letter + highlights |
| Prep | `prepNode` | `PrepResult`: summary, interview questions with model answers, tips |
| Tracker | cron | Follow-up tasks/reminders from pipeline events |

Every agent falls back to **mock mode** when no `OPENAI_API_KEY` is set, so the
full UX works without spending anything.

---

## Architecture

```
Browser ──► Next.js (App Router) ──► Supabase (Postgres + Auth + pgvector)
                 │
                 └──► LangGraph agent graph ──► OpenAI (or mock)
```

- **Frontend**: React Server Components + Tailwind, client components for the
  feed, pipeline, forms, and the streaming agent UI.
- **Backend**: App Router pages, route handlers (`src/app/api/*`), and server
  actions (`src/app/actions/*`).
- **Data**: Supabase Postgres with **Row Level Security**; three clients in
  `src/lib/supabase` — browser, server (cookie session), and admin
  (service-role, server-only).
- **AI**: LangGraph `StateGraph` in `src/lib/agents`; RAG in `src/lib/rag`;
  OpenAI provider with automatic mock fallback in `src/lib/llm`.

```
src/
  app/               pages, route handlers, server actions
    auth/            OAuth callback, sign-out, error page
    dashboard/       stats + recent applications + alerts
    jobs/            job feed + add-job form
    applications/    pipeline board + application detail
    profile/         profile form + resume upload
    onboarding/      first-sign-in contact-details flow
    upgrade/         plan + usage meter + admin premium grant
    api/             route handlers (see "API routes")
  components/        LoginForm, AgentRunner, StatusBadge, ApplyKit, etc.
  lib/
    agents/          LangGraph workflow + workers
    rag/             chunk, embed, retrieve
    llm/             OpenAI / mock provider
    supabase/        browser / server / admin clients
    services/        agent orchestration + job ingest
    jobs/            job source adapters + apply-URL classifier
    auth.ts          session helpers
    subscription.ts  quota + tier helpers
  proxy.ts           auth route protection (Next.js proxy)
supabase/
  migrations/        SQL schema + pgvector match function (0001–0007)
```

---

## Prerequisites

- Node.js 20.9+ (Next.js 16 requirement)
- A [Supabase](https://supabase.com) project
- Optional: an [OpenAI](https://platform.openai.com) API key. Without it the
  app runs in **mock mode**, so you can develop and demo for free.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Enable **pgvector** (on by default for new projects).
3. Optional: enable **Auth providers** (Google OAuth, or keep magic-link email)
   under *Authentication → Providers*.

### 3. Apply the database migrations

The schema lives in `supabase/migrations/` and must be applied **in order**:

`0001_init` → `0002_vector_match` → `0003_job_delete` → `0004_job_matches` →
`0005_job_attributes` → `0006_onboarding` → `0007_subscriptions`

Via the Supabase CLI:

```bash
npx supabase link --project-ref <your-project-ref>
npm run db:migrate
```

Or via the Dashboard: open *SQL Editor* and run each file in order.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values (full table below in [Configuration](#configuration)).

### 5. Add the auth redirect URL

Under *Authentication → URL Configuration*, add
`http://localhost:3000/auth/callback` (plus your deployed URL in production)
to the **Redirect URLs** list.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, complete
onboarding, upload your resume, and browse the job feed. To pull real jobs,
set `JOB_SOURCE` + one board token (see below) and hit **Discover jobs** on the
feed — or keep `mock` to see sample postings.

---

## Configuration

All variables are documented in [`.env.example`](.env.example):

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Secret service-role key (server-only) |
| `OPENAI_API_KEY` | no | Enables real AI; omit for mock mode |
| `AI_MODEL` | no | Default `gpt-4o-mini` |
| `EMBEDDING_MODEL` | no | Default `text-embedding-3-small` |
| `JOB_SOURCE` | no | `greenhouse`, `lever`, `workable`, `ashby`, or `mock` (default `mock`) |
| `GREENHOUSE_BOARD` | no | A company's public Greenhouse board token, e.g. `stripe` |
| `LEVER_COMPANY` | no | A company's public Lever company slug, e.g. `vercel` |
| `WORKABLE_ACCOUNT` | no | A company's public Workable account slug, e.g. `huggingface` |
| `ASHBY_JOB_BOARD` | no | A company's public Ashby job board slug, e.g. `linear` |
| `CRON_SECRET` | yes | Guards `GET /api/cron/track` and `GET /api/cron/jobs` |
| `ADMIN_EMAILS` | no | Comma-separated emails exempt from usage limits; can grant premium from `/upgrade` |
| `NEXT_PUBLIC_SITE_URL` | no | Public origin; defaults to `http://localhost:3000` |

**Live job sources** (optional). Set `JOB_SOURCE` to a company board type and
provide the matching token — e.g. `JOB_SOURCE=greenhouse` +
`GREENHOUSE_BOARD=stripe` pulls Stripe's live postings. No API keys required;
the sources are the companies' public ATS endpoints.

---

## Plans & usage limits

Free accounts get **15 resume rewrites** and **15 in-app applies** per rolling
7-day window. Premium ($15/month) and admin accounts are unlimited.

- Limits are enforced **server-side**: the apply route (`POST /api/agents/run`
  with `runType: "apply"`) returns `402 limit_reached` and the in-app Apply
  button is gated by a server action once a quota is exhausted — the client
  shows an upgrade prompt.
- Usage is tracked in the `usage_events` table (`kind`: `resume_rewrite` |
  `apply`) and surfaced on the job detail page and `/upgrade`.
- **Billing is not wired up yet** — premium is activated **manually**: admins
  grant it from `/upgrade` by email (updates `profiles.subscription_tier`).
  Stripe can be added later without changing the quota model.

---

## Mock mode

If `OPENAI_API_KEY` is unset:

- Agents return deterministic, realistic sample output (matcher score, resume,
  questions, tasks).
- Resume embeddings are generated by a local hash-based vectorizer at the same
  1536 dimensions as the real model.
- Job discovery uses the `mock` source: realistic sample postings with real
  company career-site / LinkedIn URLs.

Everything else (auth, database, UI, streaming, quotas) works normally, so you
can build and demo the full UX before wiring up real AI.

---

## Testing

```bash
npm test             # Vitest — 129 tests across 19 files
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run build        # production build (verifies routes compile)
```

Tests cover the job source adapters, apply-URL classification, feed filters,
the agent graph, quota helpers, cron auth, SSE parsing, and RAG.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run db:migrate` | `supabase db push` |
| `npm run icons` | Regenerate PWA icons (`public/icons/`) and native app assets (`mobile/assets/`) |

---

## API routes

| Route | Purpose | Auth |
| --- | --- | --- |
| `POST /api/profile/vectorize` | Chunk + embed a resume | Session |
| `POST /api/jobs/ingest` | Bulk-insert jobs (manual/feed/CSV) | Session |
| `POST /api/jobs/discover` | Fetch recent jobs from the configured source | Session |
| `POST /api/jobs/match` | Score jobs against your resume (stores `job_matches`) | Session |
| `POST /api/agents/run` | Run agents, streams progress (SSE) | Session |
| `GET /api/cron/track` | Tracker agent sweep | `CRON_SECRET` |
| `GET /api/cron/jobs` | Hourly job discovery + ingest | `CRON_SECRET` |

---

## Deploying

The app runs anywhere Next.js runs. Cron jobs are wired for **Vercel Cron** via
`vercel.json`. Both run **once per day** (06:00 UTC job discovery, 07:00 UTC
tracker sweep) — this matches Vercel's free Hobby plan, which only allows daily
cron execution. On a paid Pro plan you can change `schedule` back to hourly or
finer.

Vercel authenticates cron calls with `Authorization: Bearer $CRON_SECRET`; the
routes also accept an `x-cron-secret` header for manual or self-hosted
triggers. Set `CRON_SECRET` (and all other vars) in your environment.

---

## Known limitations

- **Premium is manual** — no Stripe checkout yet; admins grant premium from
  `/upgrade`.
- **Apply quota counts clicks** — `applyForJob` records a credit when the Apply
  button is clicked; Noventra cannot verify whether the external application
  was actually submitted.
- **Rewrite credits are consumed at run start** — a failed LLM run still spends
  one of the 15 weekly resume-rewrite credits.
- **No bot submissions** — the "Auto-apply" option opens the official page
  rather than submitting forms programmatically, by design.
- **Not yet published to stores** — the Expo app in `mobile/` is built and
  validated but has not been submitted to the Apple App Store or Google Play.
  Submission requires paid developer accounts (Apple $99/year, Google $25
  one-time) and a deployed public URL for the WebView to load — see
  `mobile/README.md`. Until then, use the installable PWA (Chrome **Install** /
  iOS **Add to Home Screen**). The app is server-rendered and auth-dependent, so
  full offline use of live data is not supported.
