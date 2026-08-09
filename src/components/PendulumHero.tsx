"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const VIEW_W = 240;
const VIEW_H = 260;
const PIVOT_X = VIEW_W / 2;
const PIVOT_Y = 26;
const THREAD = 190;
const BOB_R = 22;
const MAX_ANGLE = 1.35;
const REVEAL_ANGLE = 0.95;

interface PendulumHeroProps {
  getStartedHref: string;
  signInHref: string;
  ctaLabel: string;
}

export function PendulumHero({
  getStartedHref,
  signInHref,
  ctaLabel,
}: PendulumHeroProps) {
  const [revealed, setRevealed] = useState(false);
  const lineRef = useRef<SVGLineElement>(null);
  const bobRef = useRef<SVGCircleElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const angleRef = useRef(0);
  const velRef = useRef(0.6);
  const revealedRef = useRef(false);
  const lastAngleRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const line = lineRef.current;
    const bob = bobRef.current;
    if (!line || !bob) return;

    let raf = 0;
    let prev = performance.now();

    const place = () => {
      const a = angleRef.current;
      const bx = PIVOT_X + Math.sin(a) * THREAD;
      const by = PIVOT_Y + Math.cos(a) * THREAD;
      line.setAttribute("x2", bx.toFixed(1));
      line.setAttribute("y2", by.toFixed(1));
      bob.setAttribute("cx", bx.toFixed(1));
      bob.setAttribute("cy", by.toFixed(1));
    };

    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      if (!draggingRef.current) {
        velRef.current +=
          -6.2 * Math.sin(angleRef.current) * dt - velRef.current * 0.08 * dt;
        angleRef.current += velRef.current * dt;
        if (Math.abs(angleRef.current) > MAX_ANGLE) {
          angleRef.current = Math.sign(angleRef.current) * MAX_ANGLE;
          velRef.current = -velRef.current * 0.35;
        }
      }

      place();
      raf = requestAnimationFrame(tick);
    };

    place();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const angleFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const sx = (rect.width / VIEW_W) || 1;
    const sy = (rect.height / VIEW_H) || 1;
    const x = (clientX - rect.left) / sx - PIVOT_X;
    const y = (clientY - rect.top) / sy - PIVOT_Y;
    return Math.atan2(x, y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    svgRef.current?.setPointerCapture(e.pointerId);
    lastAngleRef.current = angleRef.current;
    lastTimeRef.current = performance.now();
    angleRef.current = Math.max(
      -MAX_ANGLE,
      Math.min(MAX_ANGLE, angleFromPointer(e.clientX, e.clientY)),
    );
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const next = Math.max(
      -MAX_ANGLE,
      Math.min(MAX_ANGLE, angleFromPointer(e.clientX, e.clientY)),
    );
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    if (dt > 0) {
      velRef.current = (next - lastAngleRef.current) / dt;
    }
    lastAngleRef.current = next;
    lastTimeRef.current = now;
    angleRef.current = next;

    if (!revealedRef.current && Math.abs(next) > REVEAL_ANGLE) {
      revealedRef.current = true;
      setRevealed(true);
    }
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    velRef.current = Math.max(-3, Math.min(3, velRef.current));
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-56 w-56 cursor-grab touch-none select-none active:cursor-grabbing sm:h-64 sm:w-64"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label="Drag the pendulum to reveal sign in options"
      >
        <path
          d="M108 26 a12 12 0 0 1 24 0 l0 4 -12 4 -12 -4 z"
          fill="#0f172a"
        />
        <circle cx={PIVOT_X} cy={PIVOT_Y} r="5" fill="#0f172a" />
        <line
          ref={lineRef}
          x1={PIVOT_X}
          y1={PIVOT_Y}
          x2={PIVOT_X}
          y2={PIVOT_Y + THREAD}
          stroke="#94a3b8"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          ref={bobRef}
          cx={PIVOT_X}
          cy={PIVOT_Y + THREAD}
          r={BOB_R}
          fill="url(#bobGrad)"
          stroke="#4338ca"
          strokeWidth="2"
        />
        <circle
          cx={PIVOT_X + 8}
          cy={PIVOT_Y + THREAD - 8}
          r="6"
          fill="#c7d2fe"
        />
        <defs>
          <linearGradient id="bobGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>

      <p
        className={`mt-2 text-sm text-slate-400 transition-opacity duration-500 ${
          revealed ? "opacity-0" : "opacity-100"
        }`}
      >
        Drag the pendulum to begin
      </p>

      <div
        className={`mt-6 flex flex-wrap items-center justify-center gap-3 transition-all duration-700 ${
          revealed
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
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
