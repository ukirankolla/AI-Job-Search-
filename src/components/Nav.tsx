import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { NavLinks } from "@/components/NavLinks";
import { PlayerBar } from "@/components/PlayerBar";

export async function Nav() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b17]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/30">
            N
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Noventra
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <PlayerBar />
              <NavLinks />
            </>
          )}
        </div>
      </div>
    </header>
  );
}