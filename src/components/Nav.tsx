import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Pipeline" },
  { href: "/profile", label: "Profile" },
];

export async function Nav() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-sm text-white">
            J
          </span>
          <span>JobOrbit</span>
        </Link>

        {user && (
          <nav className="flex items-center gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="/auth/signout"
              className="ml-2 rounded-md px-3 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Sign out
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
