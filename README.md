# Noventra

A resume-first job-search copilot. Upload your resume once, and a team of
collaborating AI agents matches fresh job postings to your skills, shows a
match percentage for every job, rewrites an ATS-friendly resume and cover
letter, and gets you to the official application page.

Built with **Next.js 16**, **Supabase** (Postgres + Auth + pgvector), and
**LangChain / LangGraph**.

## Features

- **Matcher** — scores each job against your profile (0–100) and lists your
  matched and missing skills.
- **Tailor** — rewrites your resume and writes a cover letter for a specific role.
- **Prep** — generates role-specific interview questions with model answers.
- **Tracker** — turns pipeline events into follow-up tasks and reminders.
- **Automated job discovery** — pulls fresh postings (default: last 8 hours)
  from company career portals only: a company's public **Greenhouse** or
  **Lever** job board, or a deterministic mock source when none is set. Apply
  links always point at the company's own career site or LinkedIn — never a
  third-party job board.
- **Match % for every job** — every posting in the feed is scored against your
  resume (0–100), matched or not, with matched/missing skills.
- **4 / 8 / 12-hour filters** — narrow the feed to postings from the last few
  hours.
- **ATS-friendly resume rewrite** — one button rewrites your resume for the
  exact job, with copy-ready output.
- **One-click apply** — after tailoring, a single button opens the official
  application page with your documents ready; an auto-apply option is offered.
- **Resume-first onboarding** — upload your resume once; it powers everything.
- **RAG resume search** — your resume is split into chunks and embedded, so
  agents only look at the most relevant sections for each job.
- **Pipeline board** — drag-free kanban (Saved / Applied / Interviewing /
  Offer / Rejected) with live status updates.
- **Magic-link + Google sign-in** with route protection via a Next.js proxy.

## Architecture

```
Browser ──► Next.js (App Router) ──► Supabase (Postgres + Auth + pgvector)
                 │
                 └──► LangGraph agent graph ──► OpenAI (or mock)
```

- `src/app` — pages, API routes, and server actions.
- `src/lib/agents` — the LangGraph workflow and each agent's prompt + parsing.
- `src/lib/rag` — resume chunking, embedding, and vector retrieval.
- `src/lib/llm` — OpenAI provider with an automatic **mock fallback**.
- `src/lib/supabase` — browser / server / service-role clients.
- `supabase/migrations` — schema: profiles, jobs, applications, tailored docs,
  interview preps, notifications, agent runs, and the pgvector match function.

## Prerequisites

- Node.js 20.9+ (see `package.json` engines)
- A [Supabase](https://supabase.com) project
- Optional: an [OpenAI](https://platform.openai.com) API key. Without it the
  app runs in **mock mode** (see below), so you can develop and demo for free.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Enable **pgvector** (it's enabled by default on new projects).
3. Optional: configure **Auth providers** (Google OAuth, or leave magic-link
   email enabled) under *Authentication → Providers*.

### 3. Apply the database migrations

Either via the Supabase CLI:

```bash
npx supabase link --project-ref <your-project-ref>
npm run db:migrate
```

Or via the Dashboard: open *SQL Editor*, then run the files in
`supabase/migrations/` **in order** (`0001_init.sql`, `0002_vector_match.sql`,
`0003_job_delete.sql`, `0004_job_matches.sql`, `0005_job_attributes.sql`).

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Then fill in the values (see [Configuration](#configuration)).

### 5. Add the auth redirect URL

Under *Authentication → URL Configuration*, add
`http://localhost:3000/auth/callback` to the **Redirect URLs** list. For
production, add your deployed URL as well.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in, fill out your
profile + resume, add a job, and hit **Run agents**.

## Configuration

All variables are documented in [`.env.example`](.env.example). The essentials:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Secret service-role key (server-only) |
| `OPENAI_API_KEY` | no | Enables real AI; omit for mock mode |
| `AI_MODEL` | no | Default `gpt-4o-mini` |
| `EMBEDDING_MODEL` | no | Default `text-embedding-3-small` |
| `JOB_SOURCE` | no | `greenhouse`, `lever`, or `mock` (default `mock`) |
| `GREENHOUSE_BOARD` | no | A company's public Greenhouse board token, e.g. `stripe` |
| `LEVER_COMPANY` | no | A company's public Lever company slug, e.g. `vercel` |
| `CRON_SECRET` | yes | Guards `GET /api/cron/track` and `GET /api/cron/jobs` |
| `NEXT_PUBLIC_SITE_URL` | no | Public origin; defaults to `http://localhost:3000` |

## Mock mode

If `OPENAI_API_KEY` is unset:

- Agents return deterministic, realistic sample output (matcher score, resume,
  questions, tasks).
- Resume embeddings are generated by a local hash-based vectorizer at the same
  1536 dimensions as the real model.

Everything else (auth, database, UI, streaming) works normally, so you can build
the full UX before wiring up real AI.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit tests for RAG, agents, providers, cron auth) |
| `npm run db:migrate` | `supabase db push` |

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

## Deploying

The app runs anywhere Next.js runs; the tracker cron is wired for **Vercel
Cron** via `vercel.json` (daily at 07:00 UTC). Vercel authenticates cron calls
with `Authorization: Bearer $CRON_SECRET` — the route also accepts an
`x-cron-secret` header for manual or self-hosted triggers. Set `CRON_SECRET`
in your environment (on Vercel you can either set it yourself or let Vercel
manage it automatically).

## Project structure

```
src/
  app/               pages, route handlers, server actions
    auth/            OAuth callback, sign-out, error page
    dashboard/       stats + recent applications + alerts
    jobs/            job feed + add-job form
    applications/    pipeline board + application detail
    profile/         profile form + resume upload
  components/        LoginForm, AgentRunner, StatusBadge, etc.
  lib/
    agents/          LangGraph workflow + workers
    rag/             chunk, embed, retrieve
    llm/             OpenAI / mock provider
    supabase/        clients
    services/        agent orchestration + persistence
    auth.ts          session helpers
  proxy.ts           auth route protection (Next.js proxy)
supabase/
  migrations/        SQL schema + pgvector match function
```
