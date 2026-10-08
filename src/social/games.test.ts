import { describe, it, expect } from "vitest";
import {
  assertRematchAllowed,
  gameWinner,
  commitment,
  gomokuWinner,
  putStone,
  rpsResult,
  salt,
} from "./games";
import { motion } from "../emotes";
import type { Game, Player } from "./types";
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
  deadline: 9999999999999,
  next: 0,
};
describe("미니게임과 이모트", () => {
  it("시간 초과는 착수할 참가자의 패배, 종료·초대·중단은 시간으로 승패를 바꾸지 않는다", () => {
    expect(gameWinner({ ...g, deadline: 10, next: 0 }, 10)).toBe("b");
    expect(gameWinner({ ...g, deadline: 10, next: 1 }, 10)).toBe("a");
    for (const status of [
      "invited",
      "aborted",
      "cancelled",
      "declined",
      "finished",
    ] as const)
      expect(gameWinner({ ...g, status, deadline: 10 }, 11)).toBeNull();
  });
  it("패자만 재대결 가능하고 새 세션·다른 게임은 별개", () => {
    const a = { uid: "a", session: "sa" } as Player,
      b = { uid: "b", session: "sb" } as Player;
    const won: Game = {
      ...g,
      type: "rps",
      status: "finished",
      reveals: {
        a: { choice: "rock", salt: "a" },
        b: { choice: "scissors", salt: "b" },
      },
    };
    expect(() => assertRematchAllowed([won], a, b, "rps", 0, won.id)).toThrow(
      "패배한",
    );
    expect(() => assertRematchAllowed([won], a, b, "rps", 0)).toThrow("패배한");
    expect(() =>
      assertRematchAllowed([won], b, a, "rps", 0, won.id),
    ).not.toThrow();
    expect(() => assertRematchAllowed([won], a, b, "gomoku", 0)).not.toThrow();
    expect(() =>
      assertRematchAllowed([won], { ...a, session: "new" }, b, "rps", 0),
    ).not.toThrow();
    expect(() =>
      assertRematchAllowed([won], b, a, "rps", 0, "old-id"),
    ).toThrow();
    const draw = {
      ...won,
      reveals: {
        a: { choice: "rock" as const, salt: "a" },
        b: { choice: "rock" as const, salt: "b" },
      },
    };
    expect(() =>
      assertRematchAllowed([draw], a, b, "rps", 0, draw.id),
    ).toThrow();
    expect(() =>
      assertRematchAllowed([{ ...g, deadline: 10 }], b, a, "gomoku", 10, g.id),
    ).toThrow("패배한");
    expect(() =>
      assertRematchAllowed([{ ...g, deadline: 10 }], a, b, "gomoku", 10, g.id),
    ).not.toThrow();
  });
  it("가위바위보 9개 조합의 승패", () => {
    for (const [a, b, expected] of [
      ["rock", "scissors", "host"],
      ["rock", "paper", "guest"],
      ["paper", "rock", "host"],
      ["paper", "scissors", "guest"],
      ["scissors", "paper", "host"],
      ["scissors", "rock", "guest"],
      ["rock", "rock", "draw"],
      ["paper", "paper", "draw"],
      ["scissors", "scissors", "draw"],
    ] as const)
      expect(rpsResult(a, b)).toBe(expected);
  });
  it("가로·세로·두 대각선 5목과 장목", () => {
    for (const cells of [
      [0, 1, 2, 3, 4, 5],
      [0, 15, 30, 45, 60],
      [0, 16, 32, 48, 64],
      [14, 28, 42, 56, 70],
    ])
      expect(
        gomokuWinner(
          Object.fromEntries(cells.map((c, n) => [c, { uid: "a", n }])),
        ),
      ).toBe("a");
  });
  it("행 경계가 이어지지 않는다", () =>
    expect(
      gomokuWinner(
        Object.fromEntries(
          [12, 13, 14, 15, 16].map((c, n) => [c, { uid: "a", n }]),
        ),
      ),
    ).toBe(null));
  it("차례와 중복 착수와 종료 검증", () => {
    const a = putStone(g, "a", 0);
    expect(() => putStone(a, "a", 1)).toThrow();
    expect(() => putStone(a, "b", 0)).toThrow();
    expect(putStone(a, "b", 1).next).toBe(2);
    expect(() => putStone({ ...g, status: "finished" }, "a", 1)).toThrow();
  });
  it("선택과 salt에 종속되는 SHA256 커밋", async () => {
    const nonce = salt();
    expect(nonce).toHaveLength(64);
    const hash = await commitment("id", "a", "rock", nonce);
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(await commitment("id", "a", "paper", nonce));
  });
  it("손 흔들기 스윙 폭 1.7rad, 기쁨 점프 0.42", () => {
    const poses = Array.from(
      { length: 100 },
      (_, i) => motion(i / 100, "wave").arm,
    );
    expect(Math.max(...poses) - Math.min(...poses)).toBeGreaterThan(1.65);
    expect(motion(Math.PI / 16, "joy").jump).toBeCloseTo(0.42);
    expect(Math.abs(motion(0, "surprise").leftArm)).toBeGreaterThan(2);
  });
});
