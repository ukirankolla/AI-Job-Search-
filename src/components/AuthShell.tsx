import Link from "next/link";
import Image from "next/image";

const VALUE_PROPS = [
  {
    title: "Matched in minutes",
    desc: "Every fresh posting scored 0–100 against your resume.",
  },
  {
    title: "Tailored for the role",
    desc: "ATS-friendly resume and cover letter rewritten per job.",
  },
  {
    title: "Applied on schedule",
    desc: "Auto-pilot submits email-ready applications for you.",
  },
];

/**
 * Premium split-screen layout for the auth pages: real photography and value
 * props on the left, the form on the right.
 */
export function AuthShell({
  children,
  photoAlt,
}: {
  children: React.ReactNode;
  photoAlt: string;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden min-h-[36rem] lg:block">
          <Image
            src="/hero/interview.png"
            alt={photoAlt}
            fill
            sizes="(min-width: 1024px) 40rem, 0px"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-indigo-950/85 via-indigo-900/70 to-violet-900/60"
          />

          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-sm font-bold backdrop-blur">
                N
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Noventra
              </span>
            </Link>

            <div>
              <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
                Upload your resume once. We take care of the rest.
              </h2>
              <ul className="mt-8 space-y-5">
                {VALUE_PROPS.map((v) => (
                  <li key={v.title} className="flex gap-3.5">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-semibold">{v.title}</p>
                      <p className="text-sm text-indigo-100/80">{v.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-indigo-100/60">
              Free plan includes 15 rewrites &amp; applies per week — no card
              required.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </main>
  );
}
