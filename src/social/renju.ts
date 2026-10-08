import type { Game } from "./types";
type Board = NonNullable<Game["board"]>;
const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;
function line(cell: number, dx: number, dy: number) {
  let x = cell % 15,
    y = Math.floor(cell / 15);
  while (x - dx >= 0 && x - dx < 15 && y - dy >= 0 && y - dy < 15) {
    x -= dx;
    y -= dy;
  }
  const result: number[] = [];
  while (x >= 0 && x < 15 && y >= 0 && y < 15) {
    result.push(y * 15 + x);
    x += dx;
    y += dy;
  }
  return result;
}
function run(board: Board, cells: number[], cell: number, uid: string) {
  const index = cells.indexOf(cell);
  let start = index,
    end = index;
  while (start > 0 && board[cells[start - 1]]?.uid === uid) start--;
  while (end + 1 < cells.length && board[cells[end + 1]]?.uid === uid) end++;
  return end - start + 1;
}
export function lineLengths(board: Board, cell: number, uid: string) {
  return directions.map(([dx, dy]) =>
    run(board, line(cell, dx, dy), cell, uid),
  );
}
// A straight four has two winning endpoints but is one threat: identify by its four stones.
function fours(board: Board, cells: number[], pivot: number, uid: string) {
  const groups = new Map<string, { stones: number[]; ends: Set<number> }>();
  for (let i = 0; i <= cells.length - 5; i++) {
    const window = cells.slice(i, i + 5);
    if (!window.includes(pivot)) continue;
    const stones = window.filter((c) => board[c]?.uid === uid),
      empty = window.filter((c) => !board[c]);
    if (stones.length !== 4 || empty.length !== 1) continue;
    const next = { ...board, [empty[0]]: { uid, n: 0 } };
    if (run(next, cells, empty[0], uid) !== 5) continue;
    const key = stones.join(","),
      group = groups.get(key) ?? { stones, ends: new Set<number>() };
    group.ends.add(empty[0]);
    groups.set(key, group);
  }
  return [...groups.values()];
}
export type Forbidden = "장목" | "사사" | "삼삼";
export function forbiddenMove(
  board: Board,
  cell: number,
  black: string,
): Forbidden | null {
  const memo = new Map<string, Forbidden | null>();
  function judge(position: Board, pivot: number): Forbidden | null {
    const key =
      pivot +
      ":" +
      Object.keys(position)
        .filter((c) => !!position[c])
        .sort((a, b) => +a - +b)
        .map((c) => `${c}:${position[c].uid}`)
        .join(";");
    if (memo.has(key)) return memo.get(key)!;
    const lengths = lineLengths(position, pivot, black);
    if (lengths.includes(5)) return null;
    if (lengths.some((n) => n > 5)) return "장목";
    const lines = directions.map(([dx, dy]) => line(pivot, dx, dy));
    if (
      lines.reduce(
        (n, cells) => n + fours(position, cells, pivot, black).length,
        0,
      ) > 1
    )
      return "사사";
    const threes = new Set<string>();
    for (const cells of lines) {
      const index = cells.indexOf(pivot);
      for (const extension of cells.slice(Math.max(0, index - 4), index + 5)) {
        if (position[extension]) continue;
        const next = { ...position, [extension]: { uid: black, n: 0 } };
        const open = fours(next, cells, pivot, black).filter(
          (f) => f.ends.size === 2 && f.stones.includes(extension),
        );
        if (!open.length || lineLengths(next, extension, black).includes(5))
          continue;
        // Fake threes whose extension is itself forbidden do not count (RIF 9.3).
        if (judge(next, extension)) continue;
        for (const f of open)
          threes.add(f.stones.filter((c) => c !== extension).join(","));
        if (threes.size > 1) {
          memo.set(key, "삼삼");
          return "삼삼";
        }
      }
    }
    memo.set(key, null);
    return null;
  }
  return judge(board, cell);
}
