"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MoveError, MoveResponse } from "@/lib/api";
import {
  emptyGame,
  hasWon,
  isOver,
  legalMoves,
  maxTile,
  move,
  newGame,
  spawnTile,
  toGrid,
  type Dir,
  type GameState,
} from "@/lib/game";

export type Status = "idle" | "playing" | "paused" | "error" | "won" | "lost";
export type Speed = "watch" | "normal" | "max";

/** Extra pause after each move's animation settles, so viewers can read the panel. */
const SPEED_DELAY: Record<Speed, number> = { watch: 1200, normal: 300, max: 0 };
/** Time for slide + spawn animations to finish before the next decision. */
export const ANIM_MS: Record<Speed, number> = { watch: 260, normal: 260, max: 120 };
const FIRST_MOVE_DELAY = 450;
const BEST_KEY = "jev2048:best";

export interface Decision extends MoveResponse {
  legal: Dir[];
  turn: number;
}

export interface Stats {
  moves: number;
  jevCalls: number;
  totalLatencyMs: number;
  inputTokens: number;
}

const EMPTY_STATS: Stats = { moves: 0, jevCalls: 0, totalLatencyMs: 0, inputTokens: 0 };

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), reject(signal.reason)), { once: true });
  });
}

const noopSubscribe = () => () => {};

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(v: number) {
  try {
    localStorage.setItem(BEST_KEY, String(v));
  } catch {}
}

export function useJevGame() {
  const [game, setGame] = useState<GameState>(emptyGame);
  const [status, setStatus] = useState<Status>("idle");
  const [speed, setSpeed] = useState<Speed>("normal");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<MoveError | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [lastGain, setLastGain] = useState<{ key: number; value: number } | null>(null);
  const storedBest = useSyncExternalStore(noopSubscribe, readBest, () => 0);
  const best = Math.max(storedBest, game.score);

  const speedRef = useRef(speed);
  const firstMoveRef = useRef(true);
  const autoPausedRef = useRef(false);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (game.score > readBest()) writeBest(game.score);
  }, [game.score]);

  // The loop: one step per render of `game` while playing. Cleanup aborts in-flight work,
  // so pausing, restarting or unmounting can never apply a stale move.
  useEffect(() => {
    if (status !== "playing") return;
    const ctrl = new AbortController();

    (async () => {
      const s = speedRef.current;
      await sleep(firstMoveRef.current ? FIRST_MOVE_DELAY : ANIM_MS[s] + SPEED_DELAY[s], ctrl.signal);
      firstMoveRef.current = false;

      const legal = legalMoves(game);
      setThinking(true);
      const res = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid: toGrid(game), legal }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      setThinking(false);

      if (!res.ok) {
        setError(data as MoveError);
        setStatus("error");
        return;
      }

      const answer = data as MoveResponse;
      const result = move(game, answer.move);
      const next = spawnTile(result.state, Math.random);

      setStats((st) => ({
        moves: st.moves + 1,
        jevCalls: st.jevCalls + (answer.forced ? 0 : 1),
        totalLatencyMs: st.totalLatencyMs + answer.latencyMs,
        inputTokens: st.inputTokens + answer.inputTokens,
      }));
      setDecision((d) => ({ ...answer, legal, turn: (d?.turn ?? 0) + 1 }));
      if (result.scoreGained > 0) setLastGain({ key: next.nextId, value: result.scoreGained });
      setGame(next);

      if (hasWon(next)) setStatus("won");
      else if (isOver(next)) setStatus("lost");
    })().catch((e) => {
      if (ctrl.signal.aborted) return;
      setThinking(false);
      setError({ code: "unreachable", message: e instanceof Error ? e.message : "Network error" });
      setStatus("error");
    });

    return () => {
      ctrl.abort();
      setThinking(false);
    };
  }, [status, game]);

  // Don't burn requests while nobody is watching.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setStatus((s) => {
          if (s !== "playing") return s;
          autoPausedRef.current = true;
          return "paused";
        });
      } else if (autoPausedRef.current) {
        autoPausedRef.current = false;
        setStatus((s) => (s === "paused" ? "playing" : s));
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const start = useCallback(() => {
    firstMoveRef.current = true;
    autoPausedRef.current = false;
    setGame(newGame(Math.random));
    setDecision(null);
    setError(null);
    setStats(EMPTY_STATS);
    setLastGain(null);
    setStatus("playing");
  }, []);

  const togglePause = useCallback(() => {
    autoPausedRef.current = false;
    setStatus((s) => (s === "playing" ? "paused" : s === "paused" ? "playing" : s));
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setStatus("playing");
  }, []);

  return {
    game,
    status,
    speed,
    setSpeed,
    decision,
    thinking,
    error,
    stats,
    lastGain,
    best,
    maxTile: maxTile(game),
    start,
    togglePause,
    retry,
  };
}
