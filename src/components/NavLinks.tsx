"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Pipeline" },
  { href: "/profile", label: "Profile" },
  { href: "/upgrade", label: "Upgrade" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {links.map((l) => {
        const active =
          pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              active
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
      <a
        href="/auth/signout"
        className="ml-2 rounded-md px-3 py-1.5 font-medium text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
      >
        Sign out
      </a>
    </nav>
  );
}
