import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getProviderMode } from "@/lib/llm/provider";
import { NavLinks } from "@/components/NavLinks";
import { PlayerBar } from "@/components/PlayerBar";

export async function Nav() {
  const user = await getSessionUser();
  const aiMode = getProviderMode();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/30">
            N
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Noventra
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {aiMode !== "live" && (
            <span
              title={
                aiMode === "mock"
                  ? "No OPENAI_API_KEY configured — agents return sample output."
                  : "OPENAI_API_KEY is set but does not look like a real OpenAI key — agents fall back to sample output until it is fixed."
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                aiMode === "mock"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  aiMode === "mock" ? "bg-amber-500" : "bg-rose-500"
                }`}
              />
              {aiMode === "mock" ? "Demo AI" : "Invalid API key"}
            </span>
          )}
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
