import Link from "next/link";
import { getSessionUser, isOnboarded } from "@/lib/auth";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#agents", label: "Agents" },
  { href: "#auto-pilot", label: "Auto-pilot" },
  { href: "#stories", label: "Stories" },
];

export async function LandingNav() {
  const user = await getSessionUser();
  const onboarded = user ? await isOnboarded(user.id) : false;
  const getStartedHref = !user
    ? "/signup"
    : onboarded
      ? "/dashboard"
      : "/onboarding";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b17]/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/40">
            N
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Noventra
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          {!user && (
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Sign in
            </Link>
          )}
          <Link
            href={getStartedHref}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-400 hover:to-violet-500"
          >
            {user ? "Go to dashboard" : "Get started free"}
          </Link>
        </div>
      </nav>
    </header>
  );
}