// Pure 2048 engine. No React, no randomness except through the injected rng.

export const SIZE = 4;
export const WIN_VALUE = 2048;

export type Dir = "up" | "down" | "left" | "right";
export const DIRS: readonly Dir[] = ["up", "right", "down", "left"];

export type Rng = () => number;

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  /** Spawned on the last turn — animates in. */
  isNew?: boolean;
  /** Produced by a merge on the last turn — pulses. */
  merged?: boolean;
  /** Consumed by a merge on the last turn; kept one render so it can slide under its partner. */
  ghost?: boolean;
}

export interface GameState {
  tiles: Tile[];
  score: number;
  nextId: number;
}

export type Grid = (number | null)[][];

export function liveTiles(state: GameState): Tile[] {
  return state.tiles.filter((t) => !t.ghost);
}

export function toGrid(state: GameState): Grid {
  const grid: Grid = Array.from({ length: SIZE }, () => Array<number | null>(SIZE).fill(null));
  for (const t of liveTiles(state)) grid[t.row][t.col] = t.value;
  return grid;
}

export function emptyGame(): GameState {
  return { tiles: [], score: 0, nextId: 1 };
}

export function newGame(rng: Rng): GameState {
  return spawnTile(spawnTile(emptyGame(), rng), rng);
}

export function fromGrid(grid: Grid, score = 0): GameState {
  const tiles: Tile[] = [];
  let id = 1;
  grid.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value != null) tiles.push({ id: id++, value, row: r, col: c });
    }),
  );
  return { tiles, score, nextId: id };
}

export function spawnTile(state: GameState, rng: Rng): GameState {
  const grid = toGrid(state);
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] == null) empty.push([r, c]);
  if (empty.length === 0) return state;
  const [row, col] = empty[Math.min(empty.length - 1, Math.floor(rng() * empty.length))];
  const value = rng() < 0.9 ? 2 : 4;
  return {
    ...state,
    tiles: [...state.tiles, { id: state.nextId, value, row, col, isNew: true }],
    nextId: state.nextId + 1,
  };
}

/** Cell coordinates of line `i`, ordered from the edge the tiles slide toward. */
function lineCells(dir: Dir, i: number): [number, number][] {
  const idx = Array.from({ length: SIZE }, (_, k) => k);
  switch (dir) {
    case "left":
      return idx.map((k) => [i, k]);
    case "right":
      return idx.map((k) => [i, SIZE - 1 - k]);
    case "up":
      return idx.map((k) => [k, i]);
    case "down":
      return idx.map((k) => [SIZE - 1 - k, i]);
  }
}

export interface MoveResult {
  state: GameState;
  moved: boolean;
  scoreGained: number;
}

export function move(state: GameState, dir: Dir): MoveResult {
  const byCell = new Map<string, Tile>();
  for (const t of liveTiles(state)) byCell.set(`${t.row},${t.col}`, t);

  const out: Tile[] = [];
  let nextId = state.nextId;
  let scoreGained = 0;
  let moved = false;

  for (let i = 0; i < SIZE; i++) {
    const cells = lineCells(dir, i);
    const line = cells.map(([r, c]) => byCell.get(`${r},${c}`)).filter((t): t is Tile => !!t);

    let slot = 0;
    for (let k = 0; k < line.length; k++) {
      const [row, col] = cells[slot];
      const a = line[k];
      const b = line[k + 1];
      if (b && a.value === b.value) {
        const value = a.value * 2;
        out.push(
          { id: a.id, value: a.value, row, col, ghost: true },
          { id: b.id, value: b.value, row, col, ghost: true },
          { id: nextId++, value, row, col, merged: true },
        );
        scoreGained += value;
        moved = true;
        k++;
      } else {
        if (a.row !== row || a.col !== col) moved = true;
        out.push({ id: a.id, value: a.value, row, col });
      }
      slot++;
    }
  }

  if (!moved) return { state, moved: false, scoreGained: 0 };
  return { state: { tiles: out, score: state.score + scoreGained, nextId }, moved, scoreGained };
}

export function legalMoves(state: GameState): Dir[] {
  return DIRS.filter((d) => move(state, d).moved);
}

export function maxTile(state: GameState): number {
  return liveTiles(state).reduce((m, t) => Math.max(m, t.value), 0);
}

export function hasWon(state: GameState): boolean {
  return maxTile(state) >= WIN_VALUE;
}

export function isOver(state: GameState): boolean {
  return legalMoves(state).length === 0;
}
