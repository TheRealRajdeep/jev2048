"use client";

import { motion } from "motion/react";
import type { Speed, Status } from "@/hooks/useJevGame";

const SPEEDS: { id: Speed; label: string }[] = [
  { id: "watch", label: "Watch" },
  { id: "normal", label: "Normal" },
  { id: "max", label: "Max" },
];

export function ScoreBar({
  score,
  best,
  lastGain,
}: {
  score: number;
  best: number;
  lastGain: { key: number; value: number } | null;
}) {
  return (
    <div className="flex gap-2">
      <ScoreCard label="Score" value={score}>
        {lastGain && (
          <span key={lastGain.key} className="score-delta tabular" aria-hidden>
            +{lastGain.value}
          </span>
        )}
      </ScoreCard>
      <ScoreCard label="Best" value={best} />
    </div>
  );
}

function ScoreCard({ label, value, children }: { label: string; value: number; children?: React.ReactNode }) {
  return (
    <div className="relative min-w-[92px] rounded-2xl bg-[var(--bg-raised)] px-3.5 py-2 shadow-[inset_0_0_0_1px_var(--line)]">
      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)]">{label}</div>
      <div className="tabular text-[20px] font-semibold leading-tight tracking-tight">{value.toLocaleString()}</div>
      {children}
    </div>
  );
}

export function Controls({
  speed,
  onSpeed,
  status,
  onTogglePause,
}: {
  speed: Speed;
  onSpeed: (s: Speed) => void;
  status: Status;
  onTogglePause: () => void;
}) {
  const canPause = status === "playing" || status === "paused";
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div
        role="radiogroup"
        aria-label="Speed"
        className="relative flex rounded-full bg-[var(--bg-raised)] p-1 shadow-[inset_0_0_0_1px_var(--line)]"
      >
        {SPEEDS.map((s) => {
          const on = s.id === speed;
          return (
            <button
              key={s.id}
              role="radio"
              aria-checked={on}
              onClick={() => onSpeed(s.id)}
              className="relative h-8 rounded-full px-3.5 text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              style={{ color: on ? "var(--text)" : "var(--text-3)" }}
            >
              {on && (
                <motion.span
                  layoutId="speed-pill"
                  className="absolute inset-0 rounded-full bg-[var(--surface-2)] shadow-[inset_0_0_0_1px_var(--line-strong)]"
                  transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
                />
              )}
              <span className="relative">{s.label}</span>
            </button>
          );
        })}
      </div>

      <button
        className="btn size-10 !px-0"
        onClick={onTogglePause}
        disabled={!canPause}
        style={{ opacity: canPause ? 1 : 0.4 }}
        aria-label={status === "paused" ? "Resume" : "Pause"}
      >
        {status === "paused" ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M4 2.5v9l7.5-4.5z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <rect x="3" y="2.5" width="2.6" height="9" rx="0.8" fill="currentColor" />
            <rect x="8.4" y="2.5" width="2.6" height="9" rx="0.8" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}
