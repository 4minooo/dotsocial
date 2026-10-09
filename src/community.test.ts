import { describe, it, expect } from "vitest";
import { hasProfanity, validateChat } from "./moderation";
import { interaction, stations, nearbyStation } from "./interactions";
import { spawn, blocked } from "./model";
import { mapObstacles } from "./Scenery";
import { emotes, motion } from "./emotes";
describe("커뮤니티 확장", () => {
  it("일반 대화와 시발점·시발역은 허용하고 흔한 욕설·분리·숫자·제로폭·전각 우회를 차단", () => {
    for (const text of [
      "안녕하세요!",
      "새끼 고양이가 귀여워요",
      "문제의 시발점을 찾아요",
      "시발역에서 출발",
      "classmate",
      "커피 한 잔 할까요?",
    ])
      expect(hasProfanity(text), text).toBe(false);
    for (const text of [
      "씨발",
      "시발",
      "씨 발",
      "병1신",
      "ㅅ.ㅂ",
      "ㅅㅣㅂㅏㄹ",
      "f.u.c.k",
      "ＦＵＣＫ",
      "시\u200b발",
      "안녕\n씨발",
      "시발점 씨발",
    ]) {
      expect(hasProfanity(text), text).toBe(true);
      expect(() => validateChat(text)).toThrow("욕설");
    }
  });
  it("각 맵의 소품·안전한 시작점과 상호작용 거리 검증", () => {
    for (const map of [
      "park",
      "rooftop",
      "office",
      "cafe",
      "beach",
      "campus",
    ]) {
      expect(stations.filter((s) => s.map === map)).toHaveLength(2);
      expect(blocked(spawn, mapObstacles(map))).toBe(false);
      const s = nearbyStation(map, spawn)!;
      expect(s).toBeTruthy();
      expect(interaction(map, spawn, s.id, 10)).toEqual({
        id: s.id,
        kind: s.kind,
        at: 10,
      });
      expect(() => interaction(map, { x: 6, z: 6 }, s.id, 10)).toThrow();
      expect(() => interaction("missing", spawn, s.id, 10)).toThrow();
    }
  });
  it("6가지 표현에 고유한 단축키와 실제 동작", () => {
    expect(Object.keys(emotes)).toHaveLength(6);
    expect(new Set(Object.values(emotes).map((e) => e.key)).size).toBe(6);
    const poses = Object.keys(emotes).map((e) =>
      JSON.stringify(motion(0.75, e as keyof typeof emotes)),
    );
    expect(new Set(poses).size).toBe(6);
  });
});
