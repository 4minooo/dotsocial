import { describe, expect, it } from "vitest";
import { blocked, cleanNickname, move, spawn, validNickname } from "./model";
describe("닉네임", () => {
  it("공백을 정리하고 한글·영문·숫자 2~12자만 허용한다", () => {
    expect(cleanNickname(" 도 트 3 ")).toBe("도트3");
    expect(validNickname(" 도트 친구 ")).toBe(true);
    for (const bad of [
      "a",
      "abcdefghijklmn",
      "<script>",
      "친구🙂",
      "hello-world",
    ])
      expect(validNickname(bad)).toBe(false);
  });
});
describe("이동과 충돌", () => {
  it("안전한 위치에 등장한다", () => expect(blocked(spawn)).toBe(false));
  it("화면 오른쪽과 위에 맞는 월드 방향으로 이동한다", () => {
    const right = move(spawn, 1, 0, 0.016, []),
      up = move(spawn, 0, 1, 0.016, []);
    expect(right.x).toBeGreaterThan(spawn.x);
    expect(right.z).toBeLessThan(spawn.z);
    expect(up.x).toBeLessThan(spawn.x);
    expect(up.z).toBeLessThan(spawn.z);
  });
  it("대각선 이동 속도를 정규화한다", () => {
    const a = move({ x: 0, z: 0 }, 1, 0, 0.02, []),
      b = move({ x: 0, z: 0 }, 1, 1, 0.02, []);
    expect(Math.hypot(a.x, a.z)).toBeCloseTo(Math.hypot(b.x, b.z));
  });
  it("30fps와 60fps에서 같은 거리를 이동한다", () => {
    let a = { x: 0, z: 0 },
      b = { x: 0, z: 0 };
    for (let i = 0; i < 30; i++) a = move(a, 1, 0, 1 / 30, []);
    for (let i = 0; i < 60; i++) b = move(b, 1, 0, 1 / 60, []);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.z).toBeCloseTo(b.z);
  });
  it("큰 시간 간격에서도 경계를 넘어가지 않는다", () => {
    let p = { x: 6.65, z: 0 };
    for (let i = 0; i < 50; i++) p = move(p, 1, 0, 20, []);
    expect(p.x).toBeLessThanOrEqual(6.7);
  });
  it("분수, 벤치, 나무와 충돌하고 옆으로 미끄러질 수 있다", () => {
    for (const p of [
      { x: 0, z: -3 },
      { x: -3.7, z: -2.8 },
      { x: -6, z: -5 },
    ])
      expect(blocked(p)).toBe(true);
    const p = move({ x: 1.65, z: 0 }, -1, 0, 0.05, [
      { x: 1, z: 0, w: 0.6, d: 3 },
    ]);
    expect(p.x).toBe(1.65);
    expect(p.z).toBeGreaterThan(0);
  });
  it("입력이 없거나 음수 delta이면 움직이지 않는다", () => {
    expect(move(spawn, 0, 0, 0.02)).toBe(spawn);
    expect(move(spawn, 1, 0, -1)).toEqual(spawn);
  });
});
