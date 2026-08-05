import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export const metadata = {
  title: "JobOrbit — Upload Your Resume, We Do the Rest",
  description:
    "Upload your resume once. JobOrbit's AI agents match fresh job postings, rewrite your ATS-friendly resume and cover letter, and prep you for interviews.",
};

const agents = [
  {
    name: "Matcher",
    emoji: "🎯",
    desc: "Scores fresh job postings against your resume and surfaces skill gaps.",
  },
  {
    name: "Tailor",
    emoji: "✍️",
    desc: "Rewrites your resume and cover letter for each specific role.",
  },
  {
    name: "Prep",
    emoji: "🎤",
    desc: "Generates role-specific interview questions with model answers.",
  },
  {
    name: "Tracker",
    emoji: "📈",
    desc: "Watches deadlines and pushes you to follow up at the right time.",
  },
];

export default async function Home() {
  const user = await getSessionUser();

  return (
    <main className="mx-auto max-w-6xl px-4">
      <section className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Multi-agent job search, live in your browser
        </div>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Upload your resume once.
          <span className="block text-slate-400">We do the rest.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-500">
          Our AI agents scan fresh job postings, match them to your skills, close
          your gaps, rewrite your resume and cover letter, and prep you for
          interviews — so you just apply.
        </p>
        <div className="mt-8">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Go to dashboard →
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Get started →
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((a) => (
          <div
            key={a.name}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="text-2xl">{a.emoji}</div>
            <h3 className="mt-3 font-semibold text-slate-900">{a.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{a.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
