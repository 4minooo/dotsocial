import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  ref,
  set,
  get,
  update,
  remove,
  runTransaction,
} from "firebase/database";
let env;
const profile = {
  nickname: "테스트",
  hair: 0,
  shirt: 0,
  pants: 0,
  hairstyle: "short",
  accessory: "none",
};
const roster = (uid, session) => ({
  uid,
  session,
  joinedAt: Date.now(),
  live: { [session]: true },
});
const player = (uid, session, slot) => ({
  uid,
  session,
  slot,
  profile,
  x: 0,
  z: 2.8,
  rotation: 0,
  at: Date.now(),
  emote: { kind: "none", at: 0 },
});
const db = (uid) => env.authenticatedContext(uid).database();
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-dot-social",
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: readFileSync("database.rules.json", "utf8"),
    },
  });
});
after(async () => {
  await env?.cleanup();
});
test("백경광장·확장 외형·6가지 표현과 소품 거리·종류 검증", async () => {
  await reset();
  const a = await join("alice", 0, "campus");
  await assertSucceeds(
    update(ref(a, "rooms/campus/players/0/profile"), {
      face: "wink",
      skin: 4,
      hair: 7,
      shirt: 7,
      pants: 7,
      accessory: "headphones",
      accessoryColor: 7,
    }),
  );
  await assertFails(
    update(ref(a, "rooms/campus/players/0/profile"), { skin: 5 }),
  );
  await assertFails(
    update(ref(a, "rooms/campus/players/0/profile"), { face: "invalid" }),
  );
  const current = Date.now();
  for (const [i, kind] of ["dance", "clap", "love"].entries())
    await assertSucceeds(
      set(ref(a, "rooms/campus/players/0/emote"), {
        kind,
        at: current - 6600 + i * 3300,
      }),
    );
  await assertSucceeds(
    set(ref(a, "rooms/campus/players/0/activity"), {
      id: "campus-board",
      kind: "read",
      at: Date.now(),
    }),
  );
  await assertFails(
    set(ref(a, "rooms/campus/players/0/activity"), {
      id: "park-water",
      kind: "water",
      at: Date.now(),
    }),
  );
  await assertFails(
    set(ref(a, "rooms/campus/players/0/activity"), {
      id: "campus-board",
      kind: "sip",
      at: Date.now(),
    }),
  );
  await assertSucceeds(
    update(ref(a, "rooms/campus/players/0"), { x: 6, z: 6, activity: null }),
  );
  await assertFails(
    set(ref(a, "rooms/campus/players/0/activity"), {
      id: "campus-board",
      kind: "read",
      at: Date.now(),
    }),
  );
  await assertFails(join("alice", 1, "park"));
});
test("SDK 직접 요청에도 욕설·흔한 우회를 거부하고 정상 문장은 저장", async () => {
  await reset();
  const a = await join("alice", 0);
  const message = (text) => ({
    uid: "alice",
    session: "s-alice",
    nickname: "테스트",
    text,
    at: Date.now(),
  });
  for (const text of [
    "씨발",
    "시발",
    "병1신",
    "ㅅ.ㅂ",
    "ㅅㅣㅂㅏㄹ",
    "f.u.c.k",
    "ＦＵＣＫ",
    "시\u200b발",
    "안녕\n씨발",
    "시발점 씨발",
  ])
    await assertFails(set(ref(a, "rooms/park/chat/0/0"), message(text)));
  await assertSucceeds(
    set(
      ref(a, "rooms/park/chat/0/0"),
      message("시발점과 시발역, 새끼 고양이 이야기"),
    ),
  );
});

test("긴머리 허용과 착수 없이 10초 시계 연장 거부", async () => {
  const { a, g } = await game();
  await assertSucceeds(
    set(ref(a, "rooms/park/players/0/profile/hairstyle"), "long"),
  );
  await assertFails(
    update(ref(a, "rooms/park/games/0"), { deadline: Date.now() + 20000 }),
  );
  await env.withSecurityRulesDisabled(async (c) => {
    await update(ref(c.database(), "rooms/park/games/0"), {
      deadline: Date.now() - 1000,
    });
  });
  await assertFails(
    set(ref(a, "rooms/park/games/0"), {
      ...g,
      next: 1,
      deadline: Date.now() + 10000,
      board: { 112: { uid: "alice", n: 0 } },
    }),
  );
});
test("다른 사람의 새 채팅 보호, 만료·퇴장 채팅만 정리 허용", async () => {
  await reset();
  const a = await join("alice", 0),
    b = await join("bob", 1);
  const message = {
    uid: "alice",
    session: "s-alice",
    nickname: "테스트",
    text: "잠깐의 대화",
    at: Date.now(),
  };
  await set(ref(a, "rooms/park/chat/0/0"), message);
  await assertFails(remove(ref(b, "rooms/park/chat/0/0")));
  await env.withSecurityRulesDisabled(async (c) => {
    await update(ref(c.database(), "rooms/park/chat/0/0"), {
      at: Date.now() - 600001,
    });
  });
  await assertFails(update(ref(b, "rooms/park/chat/0/0"), { text: "변조" }));
  await assertFails(remove(ref(db("outsider"), "rooms/park/chat/0/0")));
  await assertSucceeds(remove(ref(b, "rooms/park/chat/0/0")));
  await env.withSecurityRulesDisabled(async (c) => {
    await set(ref(c.database(), "rooms/park/chat/0/0"), message);
    await remove(ref(c.database(), "roster/park/0/live/s-alice"));
  });
  await assertSucceeds(remove(ref(b, "rooms/park/chat/0/0")));
});
async function reset() {
  await env.clearDatabase();
}
async function join(uid, slot, room = "park") {
  const d = db(uid);
  await set(ref(d, `roster/${room}/${slot}`), roster(uid, `s-${uid}`));
  await set(
    ref(d, `rooms/${room}/players/${slot}`),
    player(uid, `s-${uid}`, slot),
  );
  return d;
}
async function game(type = "gomoku") {
  await reset();
  const a = await join("alice", 0),
    b = await join("bob", 1);
  const g = {
    id: "match-1",
    slot: 0,
    type,
    host: "alice",
    guest: "bob",
    hostSlot: 0,
    guestSlot: 1,
    hostSession: "s-alice",
    guestSession: "s-bob",
    status: "invited",
    createdAt: Date.now(),
    deadline: Date.now() + 30000,
    next: 0,
  };
  await set(ref(a, "rooms/park/games/0"), g);
  await update(ref(b, "rooms/park/games/0"), {
    status: "active",
    deadline: Date.now() + (type === "gomoku" ? 10000 : 45000),
  });
  return {
    a,
    b,
    g: {
      ...g,
      status: "active",
      deadline: Date.now() + (type === "gomoku" ? 10000 : 45000),
    },
  };
}
test("미인증과 다른 방 읽기 거부", async () => {
  await reset();
  const a = await join("alice", 0);
  await assertFails(
    get(ref(env.unauthenticatedContext().database(), "roster")),
  );
  await assertFails(get(ref(db("outsider"), "rooms/park/players")));
  await assertFails(get(ref(a, "rooms/cafe/players")));
  await assertSucceeds(get(ref(a, "rooms/park/players")));
});
test("본인 이동 권한·좌표·외형·허용 필드 검증", async () => {
  await reset();
  const a = await join("alice", 0),
    b = await join("bob", 1);
  await assertSucceeds(update(ref(a, "rooms/park/players/0"), { x: 1 }));
  await assertFails(update(ref(b, "rooms/park/players/0"), { x: 2 }));
  await assertFails(update(ref(a, "rooms/park/players/0"), { x: 90 }));
  await assertFails(
    update(ref(a, "rooms/park/players/0/profile"), { hair: 8 }),
  );
  await assertFails(update(ref(a, "rooms/park/players/0"), { admin: true }));
});
test("정원 8개 슬롯과 중복 UID·접속 키 제한", async () => {
  await reset();
  const a = await join("alice", 0);
  await assertFails(set(ref(a, "roster/cafe/0"), roster("alice", "other")));
  await assertFails(set(ref(a, "roster/park/0/live/other"), true));
  await assertFails(
    set(ref(db("ninth"), "roster/park/8"), roster("ninth", "s9")),
  );
});
test("이전 세션 종료가 새 연결을 삭제하지 않음", async () => {
  await reset();
  const a = await join("alice", 0);
  await remove(ref(a, "roster/park/0/live/s-alice"));
  const b = await join("bob", 0);
  await assertSucceeds(remove(ref(a, "roster/park/0/live/s-alice")));
  assert.equal((await get(ref(b, "roster/park/0/live/s-bob"))).val(), true);
});
test("채팅 소유자·길이·20개 저장 슬롯 검증", async () => {
  await reset();
  const a = await join("alice", 0),
    b = await join("bob", 1);
  const m = {
    uid: "alice",
    session: "s-alice",
    nickname: "테스트",
    text: "안녕하세요",
    at: Date.now(),
  };
  await assertSucceeds(set(ref(a, "rooms/park/chat/0/0"), m));
  await assertFails(set(ref(b, "rooms/park/chat/0/1"), m));
  await assertFails(set(ref(a, "rooms/park/chat/0/20"), m));
  await assertFails(
    set(ref(a, "rooms/park/chat/0/1"), { ...m, text: "x".repeat(201) }),
  );
});
test("오목 차례·단일 착수·기존 돌 보호", async () => {
  const { a, b, g } = await game();
  await assertFails(
    set(ref(b, "rooms/park/games/0"), {
      ...g,
      next: 1,
      board: { 0: { uid: "bob", n: 0 } },
    }),
  );
  const first = { ...g, next: 1, board: { 0: { uid: "alice", n: 0 } } };
  await assertSucceeds(set(ref(a, "rooms/park/games/0"), first));
  await assertFails(
    set(ref(a, "rooms/park/games/0"), {
      ...first,
      next: 2,
      board: { ...first.board, 1: { uid: "alice", n: 1 } },
    }),
  );
  await assertFails(
    set(ref(b, "rooms/park/games/0"), {
      ...first,
      next: 2,
      board: { 0: { uid: "bob", n: 1 }, 1: { uid: "bob", n: 1 } },
    }),
  );
  await assertFails(
    set(ref(b, "rooms/park/games/0"), {
      ...first,
      next: 2,
      board: { 1: { uid: "bob", n: 1 }, 2: { uid: "bob", n: 1 } },
    }),
  );
  await assertSucceeds(
    set(ref(b, "rooms/park/games/0"), {
      ...first,
      next: 2,
      board: { ...first.board, 1: { uid: "bob", n: 1 } },
    }),
  );
});
test("가위바위보 확정 변경·선공개·다른 사용자 수정 거부", async () => {
  const { a, b } = await game("rps");
  await assertSucceeds(
    set(ref(a, "rooms/park/games/0/commits/alice"), "a".repeat(64)),
  );
  await assertFails(
    set(ref(a, "rooms/park/games/0/commits/alice"), "b".repeat(64)),
  );
  await assertFails(
    set(ref(b, "rooms/park/games/0/commits/alice"), "b".repeat(64)),
  );
  await assertFails(
    set(ref(a, "rooms/park/games/0/reveals/alice"), {
      choice: "rock",
      salt: "c".repeat(64),
    }),
  );
  await assertSucceeds(
    set(ref(b, "rooms/park/games/0/commits/bob"), "b".repeat(64)),
  );
  await assertSucceeds(
    set(ref(a, "rooms/park/games/0/reveals/alice"), {
      choice: "rock",
      salt: "c".repeat(64),
    }),
  );
});
test("비참가자·중복 게임·게임 슬롯 제한", async () => {
  const { a, b, g } = await game();
  await join("carol", 2);
  await assertFails(
    update(ref(db("carol"), "rooms/park/games/0"), { status: "aborted" }),
  );
  await assertFails(
    set(ref(a, "rooms/park/games/1"), {
      ...g,
      id: "match-2",
      slot: 1,
      status: "invited",
      next: 0,
    }),
  );
  await assertFails(
    set(ref(a, "rooms/park/games/4"), {
      ...g,
      id: "match-3",
      slot: 4,
      status: "invited",
      next: 0,
    }),
  );
  await assertSucceeds(
    update(ref(b, "rooms/park/games/0"), { status: "aborted" }),
  );
});
test("채팅 연속 쓰기 시간 제한과 런타임 데이터 누적 방지", async () => {
  await reset();
  const a = await join("alice", 0);
  const m = {
    uid: "alice",
    session: "s-alice",
    nickname: "테스트",
    text: "첫 메시지",
    at: Date.now(),
  };
  await set(ref(a, "rooms/park/chat/0/0"), m);
  await assertFails(
    set(ref(a, "rooms/park/chat/0/1"), { ...m, text: "즉시 도배" }),
  );
  await assertSucceeds(
    set(ref(a, "rooms/park/chat/0/1"), {
      ...m,
      text: "다음 메시지",
      at: m.at + 1200,
    }),
  );
  await assertFails(
    set(ref(a, "rooms/park/players/0/leak-session"), { data: "불필요한 세션" }),
  );
});
test("9명이 동시에 입장해도 8명만 자리를 확보", async () => {
  await reset();
  const results = await Promise.all(
    Array.from({ length: 9 }, async (_, i) => {
      const uid = `user${i}`,
        d = db(uid);
      for (let slot = 0; slot < 8; slot++) {
        const r = await runTransaction(
          ref(d, `roster/park/${slot}`),
          (current) => (current?.live ? undefined : roster(uid, `s${i}`)),
          { applyLocally: false },
        );
        if (r.committed) return slot;
      }
      return null;
    }),
  );
  assert.equal(results.filter((r) => r !== null).length, 8);
  assert.equal(new Set(results.filter((r) => r !== null)).size, 8);
});
