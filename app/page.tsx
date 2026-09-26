"use client";

import { motion } from "motion/react";
import { Board } from "@/components/Board";
import { Controls, ScoreBar } from "@/components/Controls";
import { JevPanel } from "@/components/JevPanel";
import { EndOverlay, ErrorToast, StartOverlay } from "@/components/Overlays";
import { useJevGame } from "@/hooks/useJevGame";

const easeOut = [0.23, 1, 0.32, 1] as const;
const enter = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: easeOut, delay: 0.05 + i * 0.06 },
});

export default function Home() {
  const g = useJevGame();
  const ended = g.status === "won" || g.status === "lost" ? g.status : null;

  return (
    <main className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-[820px] flex-col px-4 py-10 md:justify-center">
      <motion.header {...enter(0)} className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-none tracking-[-0.03em]">
            Jev plays <span className="text-[var(--accent)]">2048</span>
          </h1>
          <p className="mt-2 max-w-[400px] text-[14px] leading-relaxed text-[var(--text-2)]">
            Each move is a single typed choice from TypeSafe&rsquo;s System One model. It sees the raw board, with no search and no hints.
          </p>
        </div>
        <ScoreBar score={g.game.score} best={g.best} lastGain={g.lastGain} />
      </motion.header>

      <div className="flex flex-col items-center gap-5 md:flex-row md:items-start md:justify-between">
        <motion.div {...enter(1)} className="flex w-[var(--board)] flex-col gap-4">
          <Board game={g.game} idle={g.status === "idle"} fast={g.speed === "max"}>
            <StartOverlay show={g.status === "idle"} onStart={g.start} />
            <EndOverlay
              result={ended}
              score={g.game.score}
              maxTile={g.maxTile}
              moves={g.stats.moves}
              onPlayAgain={g.start}
            />
          </Board>
          <Controls speed={g.speed} onSpeed={g.setSpeed} status={g.status} onTogglePause={g.togglePause} />
        </motion.div>

        <motion.div {...enter(2)} className="flex w-full justify-center md:w-auto">
          <JevPanel
            decision={g.decision}
            thinking={g.thinking}
            active={g.status === "playing"}
            stats={g.stats}
          />
        </motion.div>
      </div>

      <ErrorToast error={g.error} onRetry={g.retry} />
    </main>
  );
}
