import { maps, spawn, type Point, type Profile } from "../model";
import type { Emote } from "../emotes";
import { interaction } from "../interactions";
import { validateChat } from "../moderation";
import { assertRematchAllowed, createGame, inGame, liveGame } from "./games";
import {
  emptyRoom,
  type Backend,
  type Game,
  type Player,
  type RoomState,
} from "./types";
type LocalRoom = RoomState & { seen: Record<string, number> };
const fresh = (): LocalRoom => ({ ...emptyRoom(), seen: {} });
function normalize(room: LocalRoom) {
  for (const [key, p] of Object.entries(room.players)) {
    if (Date.now() - (room.seen[p.session] ?? 0) > 12000) {
      delete room.players[key];
      delete room.seen[p.session];
    }
  }
  for (const [slot, messages] of Object.entries(room.chat)) {
    for (const [key, m] of Object.entries(messages)) {
      if (
        Date.now() - m.at >= 600000 ||
        room.players[slot]?.session !== m.session
      )
        delete messages[key];
    }
    if (!Object.keys(messages).length) delete room.chat[slot];
  }
  return room;
}
export class LocalBackend implements Backend {
  mode = "local" as const;
  uid = crypto.randomUUID();
  session = crypto.randomUUID();
  private db: IDBDatabase | null = null;
  private room = "";
  private player: Player | null = null;
  private ring = 0;
  private lastChat = 0;
  private lastEmote = 0;
  private channel = new BroadcastChannel("dot-social.local.v2");
  now() {
    return Date.now();
  }
  private open(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const r = indexedDB.open("dot-social.local.v2", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("rooms");
      r.onerror = () => reject(new Error("로컬 저장소를 사용할 수 없습니다."));
      r.onsuccess = () => {
        this.db = r.result;
        resolve(r.result);
      };
    });
  }
  private async edit<T>(
    roomId: string,
    fn: (room: LocalRoom) => T,
  ): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("rooms", "readwrite"),
        store = tx.objectStore("rooms"),
        request = store.get(roomId);
      let result: T;
      let error: unknown;
      request.onsuccess = () => {
        try {
          const room = normalize(request.result ?? fresh());
          result = fn(room);
          store.put(room, roomId);
        } catch (e) {
          error = e;
          tx.abort();
        }
      };
      tx.oncomplete = () => {
        this.channel.postMessage(roomId);
        resolve(result);
      };
      tx.onabort = () =>
        reject(error ?? new Error("로컬 상태 변경에 실패했습니다."));
      tx.onerror = () => reject(tx.error);
    });
  }
  private async read(id: string): Promise<LocalRoom> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const r = db.transaction("rooms").objectStore("rooms").get(id);
      r.onsuccess = () => resolve(normalize(r.result ?? fresh()));
      r.onerror = () => reject(r.error);
    });
  }
  counts(callback: (counts: Record<string, number>) => void) {
    let alive = true;
    const poll = async () => {
      try {
        const entries = await Promise.all(
          maps.map(
            async (m) =>
              [
                m.id,
                Object.keys((await this.read(m.id)).players).length,
              ] as const,
          ),
        );
        if (alive) callback(Object.fromEntries(entries));
      } catch {
        /* join reports storage errors */
      }
    };
    void poll();
    const timer = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }
  async join(roomId: string, profile: Profile) {
    await this.leave();
    const player = await this.edit(roomId, (room) => {
      for (let slot = 0; slot < 8; slot++) {
        if (!room.players[slot]) {
          const p: Player = {
            ...spawn,
            uid: this.uid,
            session: this.session,
            slot,
            profile,
            rotation: 0,
            at: this.now(),
            emote: { kind: "none", at: 0 },
          };
          room.players[slot] = p;
          room.seen[this.session] = this.now();
          return p;
        }
      }
      throw new Error("이 공간은 가득 찼어요. 다른 맵을 선택해 주세요.");
    });
    this.room = roomId;
    this.player = player;
    return player;
  }
  async leave() {
    if (!this.room) return;
    const id = this.room;
    this.room = "";
    this.player = null;
    await this.edit(id, (room) => {
      for (const [slot, p] of Object.entries(room.players))
        if (p.session === this.session) {
          delete room.players[slot];
          delete room.chat[slot];
        }
      delete room.seen[this.session];
    });
  }
  watch(
    callback: (state: RoomState) => void,
    connection: (status: string) => void,
  ) {
    let active = true;
    const id = this.room;
    const poll = async () => {
      try {
        const room = await this.read(id);
        if (active) {
          callback(room);
          connection("같은 브라우저의 탭끼리 연결됨");
        }
      } catch {
        if (active) connection("로컬 저장소 연결 실패");
      }
    };
    const listener = () => void poll();
    this.channel.addEventListener("message", listener);
    const timer = setInterval(poll, 500);
    const heartbeat = setInterval(() => {
      void this.edit(id, (r) => {
        if (
          this.player &&
          r.players[this.player.slot]?.session === this.session
        )
          r.seen[this.session] = this.now();
      }).catch(() => {});
    }, 3000);
    void poll();
    return () => {
      active = false;
      clearInterval(timer);
      clearInterval(heartbeat);
      this.channel.removeEventListener("message", listener);
    };
  }
  private async playerEdit(fn: (p: Player) => void) {
    if (!this.player || !this.room) return;
    await this.edit(this.room, (r) => {
      const p = r.players[this.player!.slot];
      if (!p || p.session !== this.session)
        throw new Error("다시 입장해 주세요.");
      fn(p);
      r.seen[this.session] = this.now();
    });
  }
  move(point: Point, rotation: number) {
    return this.playerEdit((p) => {
      const moved = p.x !== point.x || p.z !== point.z;
      Object.assign(p, point, { rotation, at: this.now() });
      if (moved) delete p.activity;
    });
  }
  emote(kind: Emote) {
    if (this.now() - this.lastEmote < 3300) return Promise.resolve();
    this.lastEmote = this.now();
    return this.playerEdit((p) => {
      p.emote = { kind, at: this.now() };
    });
  }
  async chat(text: string) {
    validateChat(text);
    text = text.trim();
    if (!text || text.length > 200)
      throw new Error("메시지는 1~200자로 입력해 주세요.");
    if (this.now() - this.lastChat < 1000)
      throw new Error("잠시 기다린 후 보내 주세요.");
    if (!this.player) return;
    await this.edit(this.room, (r) => {
      const slot = String(this.player!.slot);
      r.chat[slot] ??= {};
      r.chat[slot][this.ring++ % 20] = {
        uid: this.uid,
        session: this.session,
        nickname: this.player!.profile.nickname,
        text,
        at: this.now(),
      };
    });
    this.lastChat = this.now();
  }
  interact(id: string | null) {
    return this.playerEdit((p) => {
      if (id) p.activity = interaction(this.room, p, id, this.now());
      else delete p.activity;
    });
  }
  async invite(guest: Player, type: Game["type"], rematchId?: string) {
    await this.edit(this.room, (r) => {
      const host = r.players[this.player!.slot];
      if (!host || !r.players[guest.slot] || guest.uid === this.uid)
        throw new Error("상대방이 공간을 떠났어요.");
      const all = Object.values(r.games);
      assertRematchAllowed(all, host, guest, type, this.now(), rematchId);
      if (
        all.some(
          (g) =>
            liveGame(g, r.players, this.now()) &&
            (inGame(g, this.uid) || inGame(g, guest.uid)),
        )
      )
        throw new Error("이미 초대 또는 게임이 진행 중이에요.");
      for (let i = 0; i < 4; i++)
        if (!r.games[i] || !liveGame(r.games[i], r.players, this.now())) {
          r.games[i] = createGame(i, type, host, guest, this.now());
          return;
        }
      throw new Error("게임 공간이 가득 찼어요.");
    });
  }
  async mutate(id: string, change: (game: Game) => Game) {
    await this.edit(this.room, (r) => {
      const entry = Object.entries(r.games).find(([, g]) => g.id === id);
      if (!entry || !inGame(entry[1], this.uid))
        throw new Error("게임이 종료되었어요.");
      r.games[entry[0]] = change(structuredClone(entry[1]));
    });
  }
}
