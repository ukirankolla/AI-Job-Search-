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
        viewBox="0 0 400 340"
        className="h-80 w-[22rem] sm:h-96 sm:w-96"
        role="img"
        aria-label="A boy walks in carrying a briefcase, stops in the middle, tosses the briefcase, and it opens to reveal the sign-in options"
      >
        <defs>
          <linearGradient id="bcShirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cfc" />
            <stop offset="100%" stopColor="#5746ee" />
          </linearGradient>
          <linearGradient id="bcSkin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f8d3ab" />
            <stop offset="100%" stopColor="#eebd93" />
          </linearGradient>
          <linearGradient id="bcGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        <rect
          className="bc-floor"
          x="16"
          y="315"
          width="368"
          height="5"
          rx="2.5"
          fill="#0f172a"
          opacity="0.06"
        />

        <g className="bc-walker" transform="translate(160 230)">
          <ellipse cx="0" cy="88" rx="44" ry="8" fill="#0f172a" opacity="0.1" />

          <g className="bc-body">
            <g className="bc-leg-back">
              <g className="bc-thigh-back">
                <rect x="-10" y="-3" width="15" height="38" rx="6" fill="#374151" />
                <g className="bc-shin-back">
                  <rect x="-8" y="35" width="14" height="40" rx="6" fill="#374151" />
                  <g transform="translate(0 75)">
                    <rect x="-10" y="0" width="22" height="12" rx="5" fill="#0f172a" />
                    <rect
                      x="-10"
                      y="10"
                      width="22"
                      height="3"
                      rx="1.5"
                      fill="#ffffff"
                      opacity="0.85"
                    />
                  </g>
                </g>
              </g>
            </g>

            <g className="bc-torso">
              <g className="bc-arm-back">
                <rect x="-3" y="-58" width="12" height="25" rx="6" fill="#4338ca" />
                <circle cx="3" cy="-31" r="7" fill="#eab78e" />
              </g>

              <rect x="-27" y="-56" width="11" height="32" rx="5" fill="#334155" />
              <rect
                x="-17"
                y="-68"
                width="33"
                height="63"
                rx="11"
                fill="url(#bcShirt)"
              />
              <rect x="-17" y="-10" width="33" height="6" rx="3" fill="#4338ca" opacity="0.5" />
              <path
                d="M-15,-60 Q 6,-18 12,-2"
                stroke="#475569"
                strokeWidth="5"
                fill="none"
              />

              <g className="bc-head">
                <rect x="-2" y="-73" width="10" height="10" rx="3" fill="url(#bcSkin)" />
                <circle cx="4" cy="-94" r="21" fill="url(#bcSkin)" />
                <path
                  d="M-16,-90 Q-20,-102 -13,-110 Q-5,-118 5,-116 Q13,-114 18,-106 Q21,-99 20,-92 Q14,-94 8,-91 Q-4,-95 -16,-90 Z"
                  fill="#3f3229"
                />
                <path
                  d="M13,-108 Q19,-110 20,-102 Q19,-106 13,-104 Z"
                  fill="#3f3229"
                />
                <circle cx="-4" cy="-90" r="4.5" fill="#eab78e" />
                <circle cx="13" cy="-96" r="3.4" fill="#1f2937" />
                <circle cx="14" cy="-97" r="1.1" fill="#ffffff" />
                <path
                  d="M9,-102 q4,-3 9,-1"
                  stroke="#3f3229"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M10,-85 q4,3 9,1"
                  stroke="#7c2d12"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="14" cy="-90" r="3.2" fill="#f9a8d4" opacity="0.4" />
              </g>

              <g className="bc-arm-front">
                <rect x="0.5" y="-58" width="13" height="27" rx="6" fill="url(#bcShirt)" />
                <circle cx="7.5" cy="-29" r="7.5" fill="url(#bcSkin)" />
              </g>
            </g>

            <g className="bc-leg-front">
              <g className="bc-thigh-front">
                <rect x="-6" y="-3" width="15" height="38" rx="6" fill="#4b5563" />
                <g className="bc-shin-front">
                  <rect x="-5" y="35" width="14" height="40" rx="6" fill="#4b5563" />
                  <g transform="translate(0 75)">
                    <rect x="-8" y="0" width="26" height="12" rx="5" fill="#111827" />
                    <rect
                      x="-8"
                      y="10"
                      width="26"
                      height="3"
                      rx="1.5"
                      fill="#ffffff"
                      opacity="0.9"
                    />
                  </g>
                </g>
              </g>
            </g>

            <g className="bc-suitcase">
              <ellipse
                className="bc-suit-shadow"
                cx="0"
                cy="12"
                rx="20"
                ry="4.5"
                fill="#0f172a"
                opacity="0"
              />
              <g className="bc-pop">
                <path
                  d="M-22,-8 q-6,-4 -4,-12"
                  stroke="#94a3b8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M-26,4 q-8,0 -6,8"
                  stroke="#94a3b8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M20,-10 q6,-2 6,-10"
                  stroke="#94a3b8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
              <g className="bc-glow">
                <rect x="-13" y="-9" width="26" height="18" rx="3.5" fill="url(#bcGold)" />
                <path
                  d="M4,-4 l1.4,3.6 3.6,1.4 -3.6,1.4 -1.4,3.6 -1.4,-3.6 -3.6,-1.4 3.6,-1.4 Z"
                  fill="#ffffff"
                />
                <path
                  d="M11,3 l0.9,2.3 2.3,0.9 -2.3,0.9 -0.9,2.3 -0.9,-2.3 -2.3,-0.9 2.3,-0.9 Z"
                  fill="#ffffff"
                  opacity="0.85"
                />
                <path
                  d="M-7,4 l0.8,2 2,0.8 -2,0.8 -0.8,2 -0.8,-2 -2,-0.8 2,-0.8 Z"
                  fill="#ffffff"
                  opacity="0.7"
                />
              </g>
              <rect
                x="-14"
                y="-7"
                width="28"
                height="15"
                rx="4"
                fill="#b45309"
                stroke="#7c2d12"
                strokeWidth="1.5"
              />
              <rect x="-2" y="-2" width="4" height="5" rx="1.5" fill="#fbbf24" />
              <g className="bc-lid">
                <rect
                  x="-14"
                  y="-16"
                  width="28"
                  height="9"
                  rx="4"
                  fill="#92400e"
                  stroke="#7c2d12"
                  strokeWidth="1.5"
                />
                <path
                  d="M-7,-16 q0 -9 7 -9 q7 0 7 9"
                  stroke="#7c2d12"
                  strokeWidth="3.5"
                  fill="none"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>

      <p className="mt-3 text-sm font-medium text-slate-500">
        Noventra — your AI job-search copilot
      </p>

      <div className="bc-options mt-5 flex flex-wrap items-center justify-center gap-3">
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
