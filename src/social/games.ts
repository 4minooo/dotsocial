import type { Choice, Game, Player } from "./types";
export const choices: Record<Choice, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};
export function rpsResult(a: Choice, b: Choice): "draw" | "host" | "guest" {
  return a === b
    ? "draw"
    : (a === "rock" && b === "scissors") ||
        (a === "paper" && b === "rock") ||
        (a === "scissors" && b === "paper")
      ? "host"
      : "guest";
}
export function gomokuWinner(board: Game["board"]): string | null {
  const cells = board ?? {};
  for (const [key, stone] of Object.entries(cells)) {
    const cell = Number(key),
      x = cell % 15,
      y = Math.floor(cell / 15);
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ]) {
      let n = 1;
      for (; n < 5; n++) {
        const xx = x + dx * n,
          yy = y + dy * n;
        if (
          xx < 0 ||
          xx >= 15 ||
          yy < 0 ||
          yy >= 15 ||
          cells[String(yy * 15 + xx)]?.uid !== stone.uid
        )
          break;
      }
      if (n >= 5) return stone.uid;
    }
  }
  return null;
}
export function putStone(game: Game, uid: string, cell: number): Game {
  if (
    game.status !== "active" ||
    game.type !== "gomoku" ||
    !Number.isInteger(cell) ||
    cell < 0 ||
    cell > 224
  )
    throw new Error("지금은 착수할 수 없습니다.");
  if ((game.next % 2 === 0 ? game.host : game.guest) !== uid)
    throw new Error("상대방의 차례입니다.");
  if (game.board?.[cell]) throw new Error("이미 돌이 놓여 있습니다.");
  if (gomokuWinner(game.board)) throw new Error("이미 종료된 게임입니다.");
  const board = { ...game.board, [cell]: { uid, n: game.next } },
    next = game.next + 1;
  return {
    ...game,
    board,
    next,
    status: gomokuWinner(board) || next === 225 ? "finished" : "active",
  };
}
export function inGame(game: Game, uid: string) {
  return game.host === uid || game.guest === uid;
}
export function liveGame(
  game: Game,
  players: Record<string, Player>,
  now: number,
) {
  return (
    ["invited", "active"].includes(game.status) &&
    game.deadline > now &&
    Object.values(players).some(
      (p) => p.uid === game.host && p.session === game.hostSession,
    ) &&
    Object.values(players).some(
      (p) => p.uid === game.guest && p.session === game.guestSession,
    )
  );
}
export function createGame(
  slot: number,
  type: Game["type"],
  host: Player,
  guest: Player,
  now: number,
): Game {
  return {
    id: crypto.randomUUID(),
    slot,
    type,
    host: host.uid,
    guest: guest.uid,
    hostSlot: host.slot,
    guestSlot: guest.slot,
    hostSession: host.session,
    guestSession: guest.session,
    status: "invited",
    createdAt: now,
    deadline: now + 30000,
    next: 0,
  };
}
export function salt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
}
export async function commitment(
  id: string,
  uid: string,
  choice: Choice,
  nonce: string,
) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${id}:${uid}:${choice}:${nonce}`),
  );
  return Array.from(new Uint8Array(bytes), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
}
export async function verifiedResult(game: Game) {
  const a = game.reveals?.[game.host],
    b = game.reveals?.[game.guest];
  if (!a || !b) return null;
  if (
    (await commitment(game.id, game.host, a.choice, a.salt)) !==
      game.commits?.[game.host] ||
    (await commitment(game.id, game.guest, b.choice, b.salt)) !==
      game.commits?.[game.guest]
  )
    throw new Error("선택 검증에 실패했습니다. 게임을 무효 처리합니다.");
  return rpsResult(a.choice, b.choice);
}
