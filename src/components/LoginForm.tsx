"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const COOLDOWN_SECONDS = 60;

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const supabase = createClient();

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    timer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const friendlyError = (message: string) => {
    if (/rate limit|too many requests/i.test(message)) {
      return "We've hit our email limit for this hour. Please try again in a bit.";
    }
    return message;
  };

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSent(false);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    startCooldown();
    if (error) {
      setError(friendlyError(error.message));
      return;
    }
    setSent(true);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) setError(friendlyError(error.message));
  };

  const sendDisabled = loading || cooldown > 0;

  return (
    <div className="mx-auto mt-24 max-w-sm space-y-6 rounded-xl border border-slate-200 bg-white p-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Your job feed.</p>
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={signInWithEmail} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sendDisabled}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading
            ? "Sending…"
            : cooldown > 0
              ? `Try again in ${cooldown}s`
              : "Send to Gmail"}
        </button>
      </form>

      {sent && (
        <p className="text-sm text-emerald-600">
          Check your Gmail for the sign-in link.
        </p>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
