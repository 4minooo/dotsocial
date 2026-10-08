import { describe, it, expect } from "vitest";
import { forbiddenMove } from "./renju";
import { gomokuWinner, putStone } from "./games";
import type { Game } from "./types";
const board = (black: number[], white: number[] = []) =>
  Object.fromEntries([
    ...black.map((c, n) => [c, { uid: "a", n }] as const),
    ...white.map((c, n) => [c, { uid: "b", n }] as const),
  ]);
describe("렌주 금수와 10초 착수", () => {
  it("열린 삼삼과 사사 금수", () => {
    expect(forbiddenMove(board([112, 111, 113, 97, 127]), 112, "a")).toBe(
      "삼삼",
    );
    expect(
      forbiddenMove(board([112, 110, 111, 113, 82, 97, 127]), 112, "a"),
    ).toBe("사사");
  });
  it("같은 방향의 서로 다른 사도 사사", () =>
    expect(forbiddenMove(board([112, 109, 111, 113, 115]), 112, "a")).toBe(
      "사사",
    ));
  it("열린 사의 두 끝은 한 개의 사", () =>
    expect(forbiddenMove(board([112, 110, 111, 113]), 112, "a")).toBe(null));
  it("장목은 흑 금수, 백 장목 승리", () => {
    expect(forbiddenMove(board([107, 108, 109, 110, 111, 112]), 112, "a")).toBe(
      "장목",
    );
    expect(gomokuWinner(board([107, 108, 109, 110, 111, 112]), "a")).toBe(null);
    expect(gomokuWinner(board([], [107, 108, 109, 110, 111, 112]), "a")).toBe(
      "b",
    );
  });
  it("정확히 5목을 함께 만들면 승리 우선", () =>
    expect(
      forbiddenMove(board([108, 109, 110, 111, 112, 97, 127]), 112, "a"),
    ).toBe(null));
  it("막힌 삼과 가장자리 삼은 세지 않음", () => {
    expect(
      forbiddenMove(board([112, 111, 113, 97, 127], [110, 114]), 112, "a"),
    ).toBe(null);
    expect(forbiddenMove(board([106, 105, 107, 91, 121]), 106, "a")).toBe(null);
  });
  it("사사 금수로만 열린 사가 되는 가짜 삼을 제외", () =>
    expect(
      forbiddenMove(
        board([112, 111, 113, 97, 127, 69, 84, 99], [109]),
        112,
        "a",
      ),
    ).toBe(null));
  it("금수 거부, 착수마다 10초 재설정, 만료 후 거부", () => {
    const g: Game = {
      id: "test",
      slot: 0,
      type: "gomoku",
      host: "a",
      guest: "b",
      hostSlot: 0,
      guestSlot: 1,
      hostSession: "sa",
      guestSession: "sb",
      status: "active",
      createdAt: 0,
      deadline: 10000,
      next: 8,
      board: board([111, 113, 97, 127]),
    };
    expect(() => putStone(g, "a", 112, 1000)).toThrow("삼삼");
    expect(
      putStone({ ...g, next: 0, board: {} }, "a", 112, 3000).deadline,
    ).toBe(13000);
    expect(() => putStone({ ...g, board: {} }, "a", 112, 10000)).toThrow(
      "시간",
    );
  });
});
