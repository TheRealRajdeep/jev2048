import { describe, expect, it } from "vitest";
import { fromGrid, hasWon, isOver, legalMoves, move, newGame, spawnTile, toGrid, type Grid } from "./game";

const _ = null;

function after(grid: Grid, dir: Parameters<typeof move>[1]) {
  return move(fromGrid(grid), dir);
}

describe("move", () => {
  it("merges pairs once per move: [2,2,2,2] → [4,4]", () => {
    const r = after([[2, 2, 2, 2], [_, _, _, _], [_, _, _, _], [_, _, _, _]], "left");
    expect(toGrid(r.state)[0]).toEqual([4, 4, _, _]);
    expect(r.scoreGained).toBe(8);
  });

  it("does not double-merge: [2,2,4,_] → [4,4]", () => {
    const r = after([[2, 2, 4, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]], "left");
    expect(toGrid(r.state)[0]).toEqual([4, 4, _, _]);
  });

  it("merges from the leading edge: [2,2,2,_] right → [_,_,2,4]", () => {
    const r = after([[2, 2, 2, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]], "right");
    expect(toGrid(r.state)[0]).toEqual([_, _, 2, 4]);
  });

  it("moves columns up and down", () => {
    const grid: Grid = [[2, _, _, _], [_, _, _, _], [2, _, _, _], [4, _, _, _]];
    expect(toGrid(after(grid, "up").state).map((r) => r[0])).toEqual([4, 4, _, _]);
    expect(toGrid(after(grid, "down").state).map((r) => r[0])).toEqual([_, _, 4, 4]);
  });

  it("keeps consumed tiles as ghosts at the merge cell", () => {
    const r = after([[2, 2, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]], "left");
    const ghosts = r.state.tiles.filter((t) => t.ghost);
    expect(ghosts).toHaveLength(2);
    expect(ghosts.every((t) => t.row === 0 && t.col === 0)).toBe(true);
    expect(r.state.tiles.find((t) => t.merged)?.value).toBe(4);
  });

  it("reports no-op moves", () => {
    const r = after([[2, 4, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]], "left");
    expect(r.moved).toBe(false);
  });
});

describe("legalMoves / end states", () => {
  it("lists only directions that change the board", () => {
    expect(legalMoves(fromGrid([[2, _, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]])).sort()).toEqual(["down", "right"]);
  });

  it("detects game over", () => {
    const full: Grid = [[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]];
    expect(isOver(fromGrid(full))).toBe(true);
  });

  it("detects a win", () => {
    expect(hasWon(fromGrid([[2048, _, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]]))).toBe(true);
  });
});

describe("spawn", () => {
  it("starts with two tiles and spawns only into empty cells", () => {
    let i = 0;
    const seq = [0.1, 0.5, 0.99, 0.95];
    const rng = () => seq[i++ % seq.length];
    const g = newGame(rng);
    expect(g.tiles).toHaveLength(2);
    const cells = new Set(g.tiles.map((t) => `${t.row},${t.col}`));
    expect(cells.size).toBe(2);
    expect(g.tiles.map((t) => t.value)).toEqual([2, 4]);
    const full = fromGrid([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]);
    expect(spawnTile(full, rng)).toBe(full);
  });
});
