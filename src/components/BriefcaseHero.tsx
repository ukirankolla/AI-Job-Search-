"use client";

import Link from "next/link";

interface BriefcaseHeroProps {
  getStartedHref: string;
  signInHref: string;
  ctaLabel: string;
}

export function BriefcaseHero({
  getStartedHref,
  signInHref,
  ctaLabel,
}: BriefcaseHeroProps) {
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 360 330"
        className="h-72 w-72 sm:h-80 sm:w-80"
        role="img"
        aria-label="A boy drops a briefcase and the sign-in options appear"
      >
        <defs>
          <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        <g className="bh-boy">
          <ellipse cx="152" cy="302" rx="58" ry="9" fill="#0f172a" opacity="0.08" />
          <rect x="138" y="238" width="15" height="52" rx="6" fill="#475569" />
          <rect x="163" y="238" width="15" height="52" rx="6" fill="#475569" />
          <rect x="134" y="284" width="23" height="13" rx="6" fill="#0f172a" />
          <rect x="161" y="284" width="23" height="13" rx="6" fill="#0f172a" />
          <rect x="136" y="170" width="54" height="74" rx="16" fill="url(#shirtGrad)" />
          <path
            d="M140 184 q-18 8 -18 30"
            stroke="url(#shirtGrad)"
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="122" cy="216" r="8" fill="#fcd9b8" />
          <path
            d="M166 184 q22 -6 34 -30"
            stroke="url(#shirtGrad)"
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="246" cy="128" r="8" fill="#fcd9b8" />
          <circle cx="155" cy="138" r="34" fill="#fcd9b8" />
          <path
            d="M121 132 a34 34 0 0 1 68 0 l0 -10 q-34 -10 -68 0 z"
            fill="#1e293b"
          />
          <circle cx="144" cy="138" r="4" fill="#1e293b" />
          <circle cx="166" cy="138" r="4" fill="#1e293b" />
          <path
            d="M148 152 q7 8 14 0"
            stroke="#1e293b"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="134" cy="148" r="5" fill="#fca5a5" opacity="0.55" />
          <circle cx="176" cy="148" r="5" fill="#fca5a5" opacity="0.55" />
        </g>

        <g className="bh-drop">
          <g className="bh-glow">
            <rect
              x="224"
              y="242"
              width="52"
              height="28"
              rx="4"
              fill="url(#goldGrad)"
            />
            <path
              d="M250 246 l2.2 5.8 5.8 2.2 -5.8 2.2 -2.2 5.8 -2.2 -5.8 -5.8 -2.2 5.8 -2.2 z"
              fill="#fff"
            />
            <path
              d="M236 254 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4 z"
              fill="#fff"
              opacity="0.85"
            />
            <path
              d="M264 254 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4 z"
              fill="#fff"
              opacity="0.85"
            />
          </g>
          <rect
            x="222"
            y="238"
            width="56"
            height="36"
            rx="5"
            fill="#b45309"
            stroke="#78350f"
            strokeWidth="2"
          />
          <rect x="246" y="250" width="8" height="9" rx="2" fill="#f59e0b" />
          <g className="bh-lid">
            <rect
              x="222"
              y="222"
              width="56"
              height="16"
              rx="5"
              fill="#92400e"
              stroke="#78350f"
              strokeWidth="2"
            />
            <path
              d="M240 222 q0 -12 10 -12 q10 0 10 12"
              stroke="#78350f"
              strokeWidth="4"
              fill="none"
            />
          </g>
        </g>
      </svg>

      <p className="mt-2 text-sm font-medium text-slate-500">
        Noventra — your AI job-search copilot
      </p>

      <div className="bh-options mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={getStartedHref}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-500"
        >
          {ctaLabel}
        </Link>
        <Link
          href={signInHref}
          className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Sign in
        </Link>
        <a
          href="#how-it-works"
          className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          See how it works
        </a>
      </div>
    </div>
  );
}
