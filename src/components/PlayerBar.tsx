import { getGameState } from "@/lib/gamification-data";
import { getSessionUser } from "@/lib/auth";

export async function PlayerBar() {
  const user = await getSessionUser();
  if (!user) return null;

  const state = await getGameState(user.id);
  const pct = Math.round((state.xpIntoLevel / state.xpForNextLevel) * 100);

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/60 py-1 pl-2 pr-3"
      title={`${state.xp} XP total`}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
        {state.level}
      </span>
      <div className="w-20">
        <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>
        <p className="mt-0.5 text-[10px] font-medium text-indigo-600">
          Level {state.level}
        </p>
      </div>
      {state.streakDays > 0 && (
        <span
          className="text-xs font-semibold text-orange-500"
          title={`${state.streakDays}-day streak`}
        >
          🔥{state.streakDays}
        </span>
      )}
    </div>
  );
}
