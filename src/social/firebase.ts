import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  signInAnonymously,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getDatabase,
  connectDatabaseEmulator,
  ref,
  onValue,
  onDisconnect,
  runTransaction,
  update,
  set,
  remove,
  get,
  type Database,
} from "firebase/database";
import { maps, spawn, type Profile, type Point } from "../model";
import type { Emote } from "../emotes";
import { createGame, inGame, liveGame } from "./games";
import {
  emptyRoom,
  type Backend,
  type Player,
  type Roster,
  type RoomState,
  type Game,
} from "./types";
export const emulatorConfigured = import.meta.env.VITE_USE_EMULATORS === "true";
export const onlineConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_DATABASE_URL &&
  import.meta.env.VITE_FIREBASE_APP_ID
);
export async function createFirebase(
  emulator = emulatorConfigured,
): Promise<FirebaseBackend> {
  const config = emulator
    ? {
        apiKey: "demo-key",
        authDomain: "demo-dot-social.firebaseapp.com",
        projectId: "demo-dot-social",
        databaseURL: "https://demo-dot-social-default-rtdb.firebaseio.com",
        appId: "demo-app",
      }
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
  const app = initializeApp(config);
  const auth = getAuth(app),
    db = getDatabase(app);
  if (emulator) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectDatabaseEmulator(db, "127.0.0.1", 9000);
  }
  await setPersistence(auth, browserSessionPersistence);
  await auth.authStateReady();
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
  return new FirebaseBackend(db, user.uid, emulator);
}
function isLive(r: Roster) {
  return !!r?.live?.[r.session];
}
export class FirebaseBackend implements Backend {
  mode: "emulator" | "online";
  session = crypto.randomUUID();
  private room = "";
  private player: Player | null = null;
  private offset = 0;
  private ring = 0;
  private lastChat = 0;
  private lastEmote = 0;
  private stops: Array<() => void> = [];
  private status = "연결 중";
  private connected = false;
  constructor(
    private db: Database,
    public uid: string,
    emulator = false,
  ) {
    this.mode = emulator ? "emulator" : "online";
    onValue(
      ref(db, ".info/serverTimeOffset"),
      (s) => (this.offset = s.val() ?? 0),
    );
    onValue(ref(db, ".info/connected"), (s) => {
      this.connected = s.val() === true;
    });
  }
  now() {
    return Date.now() + this.offset;
  }
  counts(callback: (c: Record<string, number>) => void) {
    return onValue(ref(this.db, "roster"), (s) => {
      const all = s.val() ?? {};
      callback(
        Object.fromEntries(
          maps.map((m) => [
            m.id,
            Object.values(all[m.id] ?? {}).filter((r) => isLive(r as Roster))
              .length,
          ]),
        ),
      );
    });
  }
  async join(room: string, profile: Profile) {
    await this.leave();
    const all = (await get(ref(this.db, "roster"))).val() ?? {};
    if (
      Object.values(all).some((r) =>
        Object.values(r as Record<string, Roster>).some(
          (p) => p?.uid === this.uid && isLive(p),
        ),
      )
    )
      throw new Error(
        "이미 다른 탭에서 접속 중이에요. 그 탭에서 퇴장한 후 다시 입장해 주세요.",
      );
    for (let slot = 0; slot < 8; slot++) {
      const rosterRef = ref(this.db, `roster/${room}/${slot}`),
        liveRef = ref(this.db, `roster/${room}/${slot}/live/${this.session}`),
        playerRef = ref(this.db, `rooms/${room}/players/${slot}`);
      await onDisconnect(liveRef).remove();
      const claim = await runTransaction(
        rosterRef,
        (r: Roster | null) =>
          !r || !isLive(r)
            ? {
                uid: this.uid,
                session: this.session,
                joinedAt: this.now(),
                live: { [this.session]: true },
              }
            : undefined,
        { applyLocally: false },
      );
      if (!claim.committed) {
        await onDisconnect(liveRef).cancel();
        continue;
      }
      this.room = room;
      this.player = {
        ...spawn,
        uid: this.uid,
        session: this.session,
        slot,
        profile,
        rotation: 0,
        at: this.now(),
        emote: { kind: "none", at: 0 },
      };
      try {
        await set(playerRef, this.player);
      } catch (e) {
        await remove(liveRef);
        this.room = "";
        this.player = null;
        throw e;
      }
      return this.player;
    }
    throw new Error("이 공간은 가득 찼어요. 다른 맵을 선택해 주세요.");
  }
  async leave() {
    this.stops.forEach((s) => s());
    this.stops = [];
    if (!this.player || !this.room) return;
    const p = this.player,
      room = this.room;
    this.room = "";
    this.player = null;
    if (!this.connected) return;
    // Session-scoped disconnect paths cannot remove a replacement connection.
    await update(ref(this.db), {
      [`roster/${room}/${p.slot}/live/${this.session}`]: null,
      [`rooms/${room}/players/${p.slot}`]: null,
      [`rooms/${room}/chat/${p.slot}`]: null,
    });
    await onDisconnect(
      ref(this.db, `roster/${room}/${p.slot}/live/${this.session}`),
    ).cancel();
  }
  watch(
    callback: (state: RoomState) => void,
    connection: (status: string) => void,
  ) {
    const state = emptyRoom(),
      id = this.room;
    let active = true;
    const roster: Record<string, Roster> = {};
    let rosterReady = false;
    const emit = () => {
      if (!active) return;
      callback({
        ...state,
        players: Object.fromEntries(
          Object.entries(state.players).filter(
            ([slot, p]) =>
              roster[slot]?.uid === p.uid && roster[slot]?.live?.[p.session],
          ),
        ),
      });
    };
    const fail = (e: Error) => connection(`연결 오류: ${e.message}`);
    let pruning = false;
    const prune = async () => {
      if (!active || pruning || !this.connected || !rosterReady) return;
      const expired: Record<string, null> = {};
      for (const [slot, messages] of Object.entries(state.chat)) {
        for (const [key, m] of Object.entries(messages)) {
          const r = roster[slot];
          if (
            this.now() - m.at >= 600000 ||
            !r ||
            r.session !== m.session ||
            !r.live?.[m.session]
          )
            expired[`rooms/${id}/chat/${slot}/${key}`] = null;
        }
      }
      if (!Object.keys(expired).length) return;
      pruning = true;
      try {
        await update(ref(this.db), expired);
      } catch {
        /* A concurrent new message is protected by rules; retry next interval. */
      } finally {
        pruning = false;
      }
    };
    const pruneTimer = setInterval(() => void prune(), 15000);
    const stops = [
      onValue(
        ref(this.db, `roster/${id}`),
        (s) => {
          Object.keys(roster).forEach((k) => delete roster[k]);
          Object.assign(roster, s.val() ?? {});
          rosterReady = true;
          emit();
          void prune();
        },
        fail,
      ),
      onValue(
        ref(this.db, `rooms/${id}/players`),
        (s) => {
          const v = s.val() ?? {};
          state.players = Object.fromEntries(
            Object.entries(v).filter(([, p]) => !!p),
          ) as Record<string, Player>;
          emit();
        },
        fail,
      ),
      onValue(
        ref(this.db, `rooms/${id}/chat`),
        (s) => {
          state.chat = Object.fromEntries(
            Object.entries(s.val() ?? {})
              .filter(([, messages]) => !!messages)
              .map(([slot, messages]) => [
                slot,
                Object.fromEntries(
                  Object.entries(messages as object).filter(([, m]) => !!m),
                ),
              ]),
          );
          emit();
          void prune();
        },
        fail,
      ),
      onValue(
        ref(this.db, `rooms/${id}/games`),
        (s) => {
          state.games = Object.fromEntries(
            Object.entries(s.val() ?? {}).filter(([, g]) => !!g),
          ) as Record<string, Game>;
          emit();
        },
        fail,
      ),
      onValue(ref(this.db, ".info/connected"), (s) => {
        this.status = s.val() ? "연결됨" : "재연결 중 · 전송 일시 중지";
        connection(this.status);
        if (s.val() && this.player) {
          void this.restore().catch((e) =>
            connection(`재입장 필요: ${e.message}`),
          );
        }
      }),
    ];
    this.stops = stops;
    return () => {
      active = false;
      clearInterval(pruneTimer);
      stops.forEach((s) => s());
      this.stops = [];
    };
  }
  private async restore() {
    const p = this.player;
    if (!p) return;
    const live = ref(
        this.db,
        `roster/${this.room}/${p.slot}/live/${this.session}`,
      ),
      target = ref(this.db, `rooms/${this.room}/players/${p.slot}`);
    await onDisconnect(live).remove();
    const r = (
      await get(ref(this.db, `roster/${this.room}/${p.slot}`))
    ).val() as Roster | null;
    if (r?.session !== this.session)
      throw new Error("접속 자리가 변경되었습니다. 홈에서 다시 입장해 주세요.");
    await set(live, true);
    await set(target, p);
  }
  async move(point: Point, rotation: number) {
    if (!this.player) return;
    Object.assign(this.player, point, { rotation, at: this.now() });
    if (!this.connected) return;
    await update(
      ref(this.db, `rooms/${this.room}/players/${this.player.slot}`),
      { ...point, rotation, at: this.player.at },
    );
  }
  async emote(kind: Emote) {
    if (!this.player || !this.connected) return;
    if (this.now() - this.lastEmote < 3300) return;
    this.lastEmote = this.now();
    this.player.emote = { kind, at: this.now() };
    await update(
      ref(this.db, `rooms/${this.room}/players/${this.player.slot}`),
      { emote: this.player.emote },
    );
  }
  async chat(text: string) {
    text = text.trim();
    if (!text || text.length > 200)
      throw new Error("메시지는 1~200자로 입력해 주세요.");
    if (this.now() - this.lastChat < 1000)
      throw new Error("잠시 기다린 후 보내 주세요.");
    if (!this.player || !this.connected)
      throw new Error("연결 후 다시 보내 주세요.");
    await set(
      ref(
        this.db,
        `rooms/${this.room}/chat/${this.player.slot}/${this.ring++ % 20}`,
      ),
      {
        uid: this.uid,
        session: this.session,
        nickname: this.player.profile.nickname,
        text,
        at: this.now(),
      },
    );
    this.lastChat = this.now();
  }
  async invite(guest: Player, type: Game["type"]) {
    if (!this.player || !this.connected)
      throw new Error("연결 후 다시 시도해 주세요.");
    const state =
      (await get(ref(this.db, `rooms/${this.room}/games`))).val() ?? {};
    const players =
      (await get(ref(this.db, `rooms/${this.room}/players`))).val() ?? {};
    const flat = Object.fromEntries(
      Object.entries(players).filter(([, p]) => !!p),
    ) as Record<string, Player>;
    if (
      Object.values(state as Record<string, Game>).some(
        (g) =>
          !!g &&
          liveGame(g, flat, this.now()) &&
          (inGame(g, this.uid) || inGame(g, guest.uid)),
      )
    )
      throw new Error("이미 초대 또는 게임이 진행 중이에요.");
    for (let slot = 0; slot < 4; slot++) {
      const result = await runTransaction(
        ref(this.db, `rooms/${this.room}/games/${slot}`),
        (g: Game | null) =>
          !g || !liveGame(g, flat, this.now())
            ? createGame(slot, type, this.player!, guest, this.now())
            : undefined,
        { applyLocally: false },
      );
      if (result.committed) return;
    }
    throw new Error("게임 공간이 가득 찼어요.");
  }
  async mutate(id: string, change: (g: Game) => Game) {
    if (!this.connected) throw new Error("연결 후 다시 시도해 주세요.");
    const snapshot =
      (await get(ref(this.db, `rooms/${this.room}/games`))).val() ?? {};
    const entry = Object.entries(snapshot as Record<string, Game>).find(
      ([, g]) => g?.id === id,
    );
    if (!entry) throw new Error("게임이 종료되었어요.");
    let reason = "게임 상태가 변경되었습니다.";
    const result = await runTransaction(
      ref(this.db, `rooms/${this.room}/games/${entry[0]}`),
      (g: Game | null) => {
        if (!g || g.id !== id || !inGame(g, this.uid)) return;
        try {
          return change(g);
        } catch (e) {
          reason = (e as Error).message;
          return;
        }
      },
      { applyLocally: false },
    );
    if (!result.committed) throw new Error(reason);
  }
}
