import { getGameState } from "@/lib/gamification-data";

export async function QuestCard({ userId }: { userId: string }) {
  const state = await getGameState(userId);
  const pct = Math.round((state.xpIntoLevel / state.xpForNextLevel) * 100);

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
          Your quest
        </p>
        <span
          className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
          title={`${state.xp} total XP`}
        >
          {state.xp} XP
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500">
          <span className="text-2xl font-bold">{state.level}</span>
          <span
            aria-hidden
            className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-sm"
          >
            ⭐
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">Level {state.level}</p>
          <p className="text-sm text-indigo-200">
            {state.xpIntoLevel} / {state.xpForNextLevel} XP to level{" "}
            {state.level + 1}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all duration-700"
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm">
        <span className="text-xl">{state.streakDays > 0 ? "🔥" : "🌱"}</span>
        <span className="font-medium">
          {state.streakDays > 0
            ? `${state.streakDays}-day streak — keep it going!`
            : "Start a streak: apply to a job today."}
        </span>
      </div>

      {state.nextBadge && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Next badge
          </p>
          <p className="mt-1 font-medium">
            {state.nextBadge.emoji} {state.nextBadge.label}
          </p>
          <p className="text-sm text-indigo-200">{state.nextBadge.description}</p>
        </div>
      )}
    </div>
  );
}
