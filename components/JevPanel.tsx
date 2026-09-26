import type { Decision, Stats } from "@/hooks/useJevGame";
import type { Dir } from "@/lib/game";

const ROWS: { dir: Dir; label: string; rotate: number }[] = [
  { dir: "up", label: "Up", rotate: 0 },
  { dir: "right", label: "Right", rotate: 90 },
  { dir: "down", label: "Down", rotate: 180 },
  { dir: "left", label: "Left", rotate: 270 },
];

function Arrow({ rotate }: { rotate: number }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: `rotate(${rotate}deg)` }} aria-hidden>
      <path d="M7 12V2.5M2.5 7 7 2.5 11.5 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ConfidenceRing({ value }: { value: number | null }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden className="-rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--line-strong)" strokeWidth="3" />
      <circle
        className="ring-progress"
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - (value ?? 0))}
      />
    </svg>
  );
}

export function JevPanel({
  decision,
  thinking,
  active,
  stats,
}: {
  decision: Decision | null;
  thinking: boolean;
  active: boolean;
  stats: Stats;
}) {
  const avgLatency = stats.jevCalls ? Math.round(stats.totalLatencyMs / stats.jevCalls) : null;

  return (
    <section
      aria-label="Jev's decision"
      className="w-full max-w-[440px] md:w-[300px] rounded-[22px] bg-[var(--bg-raised)] p-5 shadow-[inset_0_0_0_1px_var(--line)]"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${thinking ? "pulse-dot bg-[var(--accent)]" : active ? "bg-[var(--accent)]" : "bg-[var(--text-3)]"}`}
          />
          <span className="text-[13px] font-medium text-[var(--text)]">Jev</span>
          <span className="text-[13px] text-[var(--text-3)]">
            {thinking ? "thinking…" : decision ? `move ${decision.turn}` : "waiting"}
          </span>
        </div>
        {decision?.forced && (
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-2)]">only move</span>
        )}
      </header>

      <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-3)]">
        <span className="font-mono text-[var(--text-2)]">choice</span>(&ldquo;Which move is best in 2048?&rdquo;)
      </p>

      <ul className="mt-4 flex flex-col gap-2.5" aria-live="polite">
        {ROWS.map(({ dir, label, rotate }) => {
          const legal = decision ? decision.legal.includes(dir) : true;
          const p = decision?.probabilities[dir] ?? 0;
          const chosen = decision?.move === dir;
          return (
            <li
              key={dir}
              className="grid grid-cols-[20px_1fr_44px] items-center gap-3 transition-opacity duration-200"
              style={{ opacity: legal ? 1 : 0.32 }}
              aria-label={`${label}: ${legal ? `${Math.round(p * 100)}%` : "not possible"}${chosen ? ", chosen" : ""}`}
            >
              <span
                className="grid place-items-center transition-colors duration-200"
                style={{ color: chosen ? "var(--accent)" : "var(--text-2)" }}
              >
                <Arrow rotate={rotate} />
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <span
                  className="bar-fill block h-full rounded-full"
                  style={{
                    ["--p" as string]: legal ? p : 0,
                    backgroundColor: chosen ? "var(--accent)" : "var(--text-3)",
                  }}
                />
              </span>
              <span
                className="tabular text-right text-[13px] transition-colors duration-200"
                style={{ color: chosen ? "var(--text)" : "var(--text-3)" }}
              >
                {!legal ? "—" : decision ? `${Math.round(p * 100)}%` : "·"}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-center gap-3 border-t border-[var(--line)] pt-4">
        <ConfidenceRing value={decision ? decision.confidence : null} />
        <div className="flex flex-1 justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)]">Confidence</div>
            <div className="tabular text-[15px] font-medium">{decision ? decision.confidence.toFixed(2) : "—"}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)]">Latency</div>
            <div className="tabular text-[15px] font-medium">
              {decision && !decision.forced ? `${decision.latencyMs} ms` : "—"}
            </div>
          </div>
        </div>
      </div>

      <dl className="tabular mt-4 grid grid-cols-3 gap-2 text-[12px]">
        <Stat label="Moves" value={stats.moves.toLocaleString()} />
        <Stat label="Avg" value={avgLatency != null ? `${avgLatency} ms` : "—"} />
        <Stat label="Tokens" value={stats.inputTokens.toLocaleString()} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] px-2.5 py-2">
      <dt className="text-[var(--text-3)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--text)]">{value}</dd>
    </div>
  );
}
