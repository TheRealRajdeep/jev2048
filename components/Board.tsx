import type { CSSProperties, ReactNode } from "react";
import type { GameState, Tile } from "@/lib/game";

// Stone → ember → gold. Low tiles recede; big tiles literally light up.
const PALETTE: Record<number, { bg: string; fg: string; glow?: string }> = {
  2: { bg: "#27231f", fg: "#cfc6ba" },
  4: { bg: "#302a24", fg: "#dcd2c4" },
  8: { bg: "#46321f", fg: "#f3dcc0" },
  16: { bg: "#5e3a1c", fg: "#ffe6c8" },
  32: { bg: "#7a3f18", fg: "#fff0dc" },
  64: { bg: "#9a4214", fg: "#fff4e6" },
  128: { bg: "linear-gradient(160deg, #c2651c, #a94c14)", fg: "#fff7ec", glow: "0 0 18px -2px rgb(230 120 40 / 0.35)" },
  256: { bg: "linear-gradient(160deg, #d97d24, #bf5d17)", fg: "#fff9f0", glow: "0 0 22px -2px rgb(240 140 50 / 0.42)" },
  512: { bg: "linear-gradient(160deg, #e9982f, #d2741d)", fg: "#1c1006", glow: "0 0 26px -2px rgb(250 160 60 / 0.48)" },
  1024: { bg: "linear-gradient(160deg, #f5b845, #e48d27)", fg: "#1c1006", glow: "0 0 32px 0 rgb(255 180 70 / 0.52)" },
  2048: { bg: "linear-gradient(160deg, #ffe08a, #ffac3d)", fg: "#1c1006", glow: "0 0 40px 2px rgb(255 190 80 / 0.6)" },
};
const BEYOND = { bg: "linear-gradient(160deg, #fff1c2, #ffc55c)", fg: "#1c1006", glow: "0 0 44px 4px rgb(255 210 110 / 0.6)" };

function fontSize(value: number) {
  const digits = String(value).length;
  const scale = digits <= 2 ? 0.44 : digits === 3 ? 0.36 : digits === 4 ? 0.29 : 0.24;
  return `calc(var(--cell) * ${scale})`;
}

function TileView({ tile }: { tile: Tile }) {
  const p = PALETTE[tile.value] ?? BEYOND;
  const style = {
    "--row": tile.row,
    "--col": tile.col,
    "--tile-bg": p.bg,
    "--tile-fg": p.fg,
    "--tile-glow": p.glow,
  } as CSSProperties;
  return (
    <div
      className="tile"
      style={style}
      data-new={tile.isNew || undefined}
      data-merged={tile.merged || undefined}
      data-ghost={tile.ghost || undefined}
      data-value={tile.value}
      aria-hidden={tile.ghost || undefined}
    >
      <div className="tile-inner" style={{ fontSize: fontSize(tile.value) }}>
        {tile.value}
      </div>
    </div>
  );
}

export function Board({
  game,
  idle,
  fast,
  children,
}: {
  game: GameState;
  idle: boolean;
  fast: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="relative">
      <div className="board" data-idle={idle} data-speed={fast ? "max" : undefined} role="img" aria-label={describe(game)}>
        <div className="cells">
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className="cell" />
          ))}
        </div>
        <div className="tiles">
          {game.tiles.map((t) => (
            <TileView key={t.id} tile={t} />
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

function describe(game: GameState) {
  const live = game.tiles.filter((t) => !t.ghost);
  if (live.length === 0) return "Empty 2048 board";
  return `2048 board with ${live.length} tiles, highest ${Math.max(...live.map((t) => t.value))}`;
}
