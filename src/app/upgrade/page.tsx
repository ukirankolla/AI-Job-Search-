import { requireOnboarded } from "@/lib/auth";
import { getUsageSummary } from "@/lib/subscription";
import { PremiumGrantForm } from "@/components/PremiumGrantForm";

export const metadata = { title: "Upgrade | Noventra" };

const features = [
  "Unlimited resume rewrites",
  "Unlimited in-app applies",
  "All current and future agent features",
  "Priority matching and prep",
];

export default async function UpgradePage() {
  const user = await requireOnboarded();
  const plan = await getUsageSummary(user.id, user.email);

  const unlimited = plan.tier === "premium" || plan.admin;
  const rewritesLeft = Math.max(0, plan.limit - plan.usage.resume_rewrite);
  const appliesLeft = Math.max(0, plan.limit - plan.usage.apply);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
        Upgrade
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        Plan &amp; usage
      </h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {unlimited
                ? "Premium"
                : `Free plan · ${plan.limit} / week`}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {unlimited
                ? "You have unlimited resume rewrites and in-app applies."
                : "Free accounts get 15 resume rewrites and 15 in-app applies per rolling 7 days. Upgrade for unlimited."}
            </p>
          </div>
          {!unlimited && (
            <span className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30">
              $15 / month
            </span>
          )}
        </div>

        {!unlimited && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Resume rewrites left</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {rewritesLeft}
                <span className="text-base font-medium text-slate-400">
                  /{plan.limit}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">In-app applies left</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {appliesLeft}
                <span className="text-base font-medium text-slate-400">
                  /{plan.limit}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
              </svg>
            </span>
            {f}
          </li>
        ))}
      </ul>

      {!unlimited && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">
            Premium is currently activated manually.
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Billing is not wired up yet — an admin enables your account.
            Contact your administrator to get upgraded, or ask them to use the
            grant form below.
          </p>
        </div>
      )}

      {plan.admin && <PremiumGrantForm />}
    </main>
  );
}
