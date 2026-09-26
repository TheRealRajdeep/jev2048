"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import type { MoveError } from "@/lib/api";

const easeOut = [0.23, 1, 0.32, 1] as const;

export function StartOverlay({ show, onStart }: { show: boolean; onStart: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 z-10 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
          transition={{ duration: 0.25, ease: easeOut }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <button className="btn btn-primary" onClick={onStart} autoFocus>
              <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
                <path d="M4 2.5v9l7.5-4.5z" fill="currentColor" />
              </svg>
              Start playing
            </button>
            <p className="max-w-[240px] text-[13px] leading-relaxed text-[var(--text-2)]">
              Jev picks every move. You just watch.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EndOverlay({
  result,
  score,
  maxTile,
  moves,
  onPlayAgain,
}: {
  result: "won" | "lost" | null;
  score: number;
  maxTile: number;
  moves: number;
  onPlayAgain: () => void;
}) {
  useEffect(() => {
    if (result !== "won") return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const base = { disableForReducedMotion: true, colors: ["#ffcf6b", "#ff9a3c", "#fff1c2", "#e48d27"], ticks: 220 };
      confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 38, origin: { x: 0.35, y: 0.55 }, angle: 60 });
      confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 38, origin: { x: 0.65, y: 0.55 }, angle: 120 });
    });
    return () => {
      cancelled = true;
    };
  }, [result]);

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          className="absolute inset-0 z-10 grid place-items-center rounded-[calc(var(--radius-tile)+var(--pad))] bg-[rgb(12_11_10/0.55)] backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: easeOut, delay: 0.25 }}
        >
          <motion.div
            className="flex flex-col items-center gap-1 text-center"
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: easeOut, delay: 0.3 }}
          >
            <div className="text-[12px] uppercase tracking-[0.12em] text-[var(--accent)]">
              {result === "won" ? "Jev reached" : "Game over"}
            </div>
            <div className="text-[44px] font-semibold leading-none tracking-tight">
              {result === "won" ? "2048" : score.toLocaleString()}
            </div>
            <div className="tabular mt-2 text-[13px] text-[var(--text-2)]">
              {result === "won"
                ? `${score.toLocaleString()} points in ${moves} moves`
                : `Best tile ${maxTile} · ${moves} moves`}
            </div>
            <button className="btn btn-primary mt-5" onClick={onPlayAgain} autoFocus>
              Play again
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ErrorToast({ error, onRetry }: { error: MoveError | null; onRetry: () => void }) {
  const fatal = error?.code === "bad_request";
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 flex w-[min(calc(100vw-32px),420px)] items-center gap-3 rounded-2xl bg-[var(--surface)] py-3 pl-4 pr-3 shadow-[inset_0_0_0_1px_var(--line-strong),0_20px_50px_-20px_rgb(0_0_0/0.9)]"
          initial={{ opacity: 0, transform: "translate(-50%, 16px)" }}
          animate={{ opacity: 1, transform: "translate(-50%, 0px)" }}
          exit={{ opacity: 0, transform: "translate(-50%, 8px)", transition: { duration: 0.15 } }}
          transition={{ duration: 0.3, ease: easeOut }}
        >
          <span className="size-2 shrink-0 rounded-full bg-[var(--danger)]" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium">
              {error.code === "no_key" ? "Jev needs an API key" : "Jev is unreachable"}
            </div>
            <div className="truncate text-[12px] text-[var(--text-2)]">{error.message}</div>
          </div>
          {!fatal && (
            <button className="btn h-8 px-3 text-[13px]" onClick={onRetry}>
              Retry
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
