import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Info,
  MessageCircle,
  Send,
  SlidersHorizontal,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import World from "./World";
import Lobby from "./Lobby";
import GamePanel from "./GamePanel";
import SoundControl from "./SoundControl";
import { sound } from "./sound";
import { nearbyStation, stations } from "./interactions";
import { hasProfanity } from "./moderation";
import DirectionPad from "./DirectionPad";
import useSocial, { mode } from "./social/useSocial";
import { inGame } from "./social/games";
import { EMOTE_DURATION, emotes, type Emote } from "./emotes";
import {
  cleanNickname,
  loadProfile,
  maps,
  palettes,
  spawn,
  storageKey,
  validNickname,
  type Point,
  type Profile,
} from "./model";
import type { Message } from "./social/types";

export default function App() {
  const social = useSocial(),
    [profile, setProfile] = useState<Profile>(loadProfile),
    [selected, setSelected] = useState("park"),
    [joining, setJoining] = useState(false),
    [quality, setQuality] = useState("normal"),
    [help, setHelp] = useState(false),
    [pose, setPose] = useState<{ kind: Emote; at: number } | null>(null),
    [pos, setPos] = useState<Point>(spawn),
    [ready, setReady] = useState(false),
    [storageWarning, setStorageWarning] = useState(false),
    [draft, setDraft] = useState(""),
    [sending, setSending] = useState(false),
    [closed, setClosed] = useState(new Set<string>()),
    [muted, setMuted] = useState(new Set<string>());
  const chatInput = useRef<HTMLTextAreaElement>(null),
    chatEnd = useRef<HTMLDivElement>(null),
    emoteAt = useRef(0);
  const touchKeys = useRef(new Set<string>());
  const chatSounds = useRef({
    room: null as string | null,
    since: 0,
    seen: new Set<string>(),
  });
  const map = maps.find((m) => m.id === (social.room ?? selected))!,
    uid = social.service?.uid ?? "",
    players = Object.values(social.state.players),
    remote = players.filter((p) => p.uid !== uid),
    currentEmote =
      pose && social.now - pose.at < EMOTE_DURATION ? pose.kind : undefined;
  const messages = Object.values(social.state.chat)
    .flatMap((r) => Object.values(r))
    .filter(
      (m) =>
        !hasProfanity(m.text) &&
        !muted.has(m.uid) &&
        social.now - m.at < 600000 &&
        players.some((p) => p.uid === m.uid && p.session === m.session),
    )
    .sort((a, b) => a.at - b.at)
    .slice(-80);
  const activity = players.find((p) => p.uid === uid)?.activity;
  const nearby = social.room ? nearbyStation(social.room, pos) : undefined;
  const recent: Record<string, string> = {};
  for (const m of messages)
    if (social.now - m.at < 5000) recent[m.uid] = m.text;
  const game = Object.values(social.state.games)
    .filter(
      (g) =>
        inGame(g, uid) &&
        !closed.has(g.id) &&
        (g.host === uid ? g.hostSession : g.guestSession) ===
          social.service?.session,
    )
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  const useProp = useCallback(() => {
    if (!social.room || help || game || !nearby) return;
    void social.service
      ?.interact(activity ? null : nearby.id)
      .catch((e) => social.setError(e.message));
  }, [social.room, social.service, help, game, nearby, activity]);
  useEffect(() => {
    if (validNickname(profile.nickname)) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            ...profile,
            nickname: cleanNickname(profile.nickname),
          }),
        );
        setStorageWarning(false);
      } catch {
        setStorageWarning(true);
      }
    }
  }, [profile]);
  useEffect(() => {
    const log = chatEnd.current?.parentElement;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages.length, messages.at(-1)?.at]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [social.room]);
  useEffect(() => {
    const tracking = chatSounds.current;
    if (tracking.room !== social.room) {
      tracking.room = social.room;
      tracking.since = social.service?.now() ?? Date.now();
      tracking.seen.clear();
    }
    if (!social.room) return;
    const key = (m: Message) =>
      JSON.stringify([m.uid, m.session, m.at, m.text]);
    const visible = new Set(messages.map(key));
    let arrived = false;
    for (const m of Object.values(social.state.chat).flatMap((r) =>
      Object.values(r),
    )) {
      const id = key(m);
      if (!tracking.seen.has(id) && m.at >= tracking.since && visible.has(id))
        arrived = true;
      tracking.seen.add(id);
    }
    // Remember messages even while muted to avoid replaying them when unmuting.
    while (tracking.seen.size > 4096)
      tracking.seen.delete(tracking.seen.values().next().value!);
    if (arrived) sound.cue("chat");
  }, [social.room, social.state.chat, social.service, messages]);
  const emote = useCallback(
    (kind: Emote) => {
      if (social.now - emoteAt.current < 3300) return;
      emoteAt.current = social.now;
      setPose({ kind, at: social.now });
      if (social.room)
        void social.service
          ?.emote(kind)
          .catch((e) => social.setError(e.message));
    },
    [social.now, social.room, social.service, social.setError],
  );
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && help) {
        setHelp(false);
        return;
      }
      const el = document.activeElement;
      if (
        el instanceof HTMLElement &&
        (el.matches("input,textarea,select") || el.isContentEditable)
      )
        return;
      if (e.isComposing || e.keyCode === 229 || game || help) return;
      if (e.key === "Enter" && social.room) {
        e.preventDefault();
        chatInput.current?.focus();
      }
      for (const [kind, value] of Object.entries(emotes))
        if (e.key === value.key && social.room) emote(kind as Emote);
      if (e.key.toLowerCase() === "e" && !e.repeat) useProp();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [help, game, social.room, emote, useProp]);
  useEffect(() => {
    if (!help && !game) return;
    const previous = document.activeElement as HTMLElement;
    const modal = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,textarea,select,[tabindex="0"]',
        ) ?? [],
      );
    focusable()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = focusable();
      if (!all.length) return;
      const first = all[0],
        last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trap);
    return () => {
      window.removeEventListener("keydown", trap);
      previous?.focus?.();
    };
  }, [help, game?.id]);
  const enter = async (id = selected) => {
    if (joining || !validNickname(profile.nickname)) return;
    setJoining(true);
    social.setError("");
    try {
      if (social.room) await social.leave();
      const p = { ...profile, nickname: cleanNickname(profile.nickname) };
      setProfile(p);
      setPose(null);
      setReady(false);
      setPos(spawn);
      setDraft("");
      setClosed(new Set());
      await social.join(id, p);
      setSelected(id);
    } catch (e) {
      social.setError((e as Error).message);
    } finally {
      setJoining(false);
    }
  };
  const leave = () => {
    setPose(null);
    void social.leave();
  };
  const movement = useCallback(
    (p: Point, rotation: number, walking: boolean) => {
      setPos(p);
      setReady(true);
      social.movement(p, rotation, walking);
    },
    [social.movement],
  );
  const send = async () => {
    if (sending || !draft.trim()) return;
    setSending(true);
    try {
      await social.service?.chat(draft);
      setDraft("");
    } catch (e) {
      social.setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };
  const onError = useCallback(
    (message: string) => social.setError(message),
    [social.setError],
  );
  const messageKey = (m: Message) => `${m.session}:${m.at}:${m.text}`;
  return (
    <div className={social.room ? "app in-room" : "app"}>
      <header className="topbar">
        <button
          className="brand brand-button"
          onClick={leave}
          aria-label="DOT SOCIAL 홈"
        >
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            dot<span className="brand-light">social</span>
            <span className="brand-period">.</span>
          </span>
        </button>
        <nav>
          <SoundControl map={social.room} />
          <span className="build-badge">
            <span />
            {mode === "local"
              ? "LOCAL TABS"
              : mode === "emulator"
                ? "FIREBASE TEST"
                : "ONLINE"}
            <span className="version">v1.0</span>
          </span>
          <button
            className="icon-btn"
            onClick={() => setHelp(true)}
            aria-label="도움말"
          >
            <Info size={19} />
          </button>
        </nav>
      </header>
      {!social.room && (
        <div className="connection-controls">
          <span>
            {mode === "local"
              ? "같은 브라우저에서 탭을 추가하면 함께 만날 수 있어요."
              : social.status}
          </span>
          <div>
            <button
              className={mode === "local" ? "active" : ""}
              onClick={() => {
                location.search = "?mode=local";
              }}
            >
              로컬 탭 연결
            </button>
            {import.meta.env.DEV && (
              <button
                className={mode === "emulator" ? "active" : ""}
                onClick={() => {
                  location.search = "?mode=emulator";
                }}
              >
                Firebase 테스트
              </button>
            )}
            {import.meta.env.VITE_FIREBASE_API_KEY && (
              <button
                className={mode === "online" ? "active" : ""}
                onClick={() => {
                  location.search = "?mode=online";
                }}
              >
                온라인 연결
              </button>
            )}
          </div>
        </div>
      )}
      {!social.room ? (
        <Lobby
          profile={profile}
          setProfile={setProfile}
          selected={selected}
          setSelected={setSelected}
          wave={currentEmote === "wave"}
          onWave={() => emote("wave")}
          enter={() => void enter()}
          joining={joining}
          ready={!!social.service}
          counts={social.counts}
          mode={mode}
          storageWarning={storageWarning}
        />
      ) : (
        <main className="room-layout">
          <section className={`world-panel world-${social.room}`}>
            <div className="room-top">
              <button className="back-button" onClick={leave}>
                <ArrowLeft size={15} /> 홈으로
              </button>
              <select
                className="room-selector"
                aria-label="맵 변경"
                value={social.room}
                onChange={(e) => void enter(e.target.value)}
                disabled={joining}
              >
                {maps.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.name}
                  </option>
                ))}
              </select>
              <button
                className="icon-btn"
                onClick={() => setHelp(true)}
                aria-label="공원 조작 도움말"
              >
                <Info size={19} />
              </button>
            </div>
            <div className="room-canvas">
              <World
                key={social.room}
                profile={profile}
                playing
                paused={help || !!game}
                map={social.room}
                quality={quality}
                emote={currentEmote}
                activity={activity}
                players={remote}
                time={social.now}
                messages={recent}
                message={recent[uid]}
                onMove={movement}
                touchKeys={touchKeys.current}
              />
            </div>
            <DirectionPad
              key={social.room}
              keys={touchKeys}
              disabled={!ready || help || !!game}
            />
            <div
              className="interaction-hint"
              role="group"
              aria-label="소품 상호작용"
            >
              {nearby ? (
                <button
                  disabled={help || !!game || joining}
                  onClick={useProp}
                  aria-label={activity ? "소품 사용 마치기" : nearby.label}
                >
                  <span>{nearby.icon}</span>
                  <div>
                    <b>{activity ? "소품 사용 마치기" : nearby.label}</b>
                    <small>
                      {activity
                        ? "이동하면 동작이 끝나요"
                        : "E 키 또는 터치로 사용"}
                    </small>
                  </div>
                  <kbd>E</kbd>
                </button>
              ) : (
                <span>🧭 소품 가까이에서 E 키·터치로 놀아보세요</span>
              )}
              {activity && (
                <span className="activity-state" role="status">
                  {stations.find((s) => s.id === activity.id)?.label} 중
                </span>
              )}
            </div>
            <div className="world-caption">
              <span className="pill">
                {map.icon} {map.name}
              </span>
              <h2>{map.description}</h2>
              <p role="status">
                {ready
                  ? "방향키·화면 버튼 이동 · Enter 채팅 · 1~6 이모트 · E 소품"
                  : "공간을 준비하고 있어요…"}
              </p>
            </div>
            <div className="room-bottom">
              <div className="key-hint">
                <span>←</span>
                <span>↑</span>
                <span>↓</span>
                <span>→</span> 이동
                <i />
                <span>Enter</span> 채팅
              </div>
              <div
                className="coordinates"
                data-testid="position"
                data-ready={ready}
                data-x={pos.x.toFixed(3)}
                data-z={pos.z.toFixed(3)}
              >
                {pos.x.toFixed(1)}, {pos.z.toFixed(1)}
              </div>
            </div>
          </section>
          <aside className="room-sidebar">
            <div className="you-card">
              <div className="mini-avatar">
                <World profile={profile} preview emote={currentEmote} />
              </div>
              <div>
                <span className="eyebrow">THAT’S YOU</span>
                <h3>{profile.nickname}</h3>
                <p>
                  <span className="status-dot" />
                  {social.status}
                </p>
              </div>
              <button
                className="icon-btn"
                onClick={leave}
                aria-label="캐릭터 다시 꾸미기"
              >
                <SlidersHorizontal size={17} />
              </button>
            </div>
            <div className="sidebar-block people-block">
              <div className="sidebar-title">
                <h3>
                  <Users size={16} /> 함께 있는 사람
                </h3>
                <span data-testid="player-count">{players.length}/8</span>
              </div>
              {players.map((p) => (
                <div key={p.session} className="participant participant-row">
                  <span
                    className="participant-dot"
                    style={{ background: palettes.shirt[p.profile.shirt] }}
                  />
                  <span>{p.profile.nickname}</span>
                  {p.uid === uid ? (
                    <span className="self-tag">나</span>
                  ) : (
                    <div className="participant-actions">
                      <button
                        onClick={() =>
                          void social.service
                            ?.invite(p, "rps")
                            .catch((e) => social.setError(e.message))
                        }
                        aria-label={`${p.profile.nickname} 님에게 가위바위보 초대`}
                      >
                        ✊
                      </button>
                      <button
                        onClick={() =>
                          void social.service
                            ?.invite(p, "gomoku")
                            .catch((e) => social.setError(e.message))
                        }
                        aria-label={`${p.profile.nickname} 님에게 오목 초대`}
                      >
                        ●
                      </button>
                      <button
                        onClick={() =>
                          setMuted((v) => {
                            const n = new Set(v);
                            n.has(p.uid) ? n.delete(p.uid) : n.add(p.uid);
                            return n;
                          })
                        }
                        aria-label={`${p.profile.nickname} 님 ${muted.has(p.uid) ? "음소거 해제" : "음소거"}`}
                      >
                        {muted.has(p.uid) ? (
                          <VolumeX size={12} />
                        ) : (
                          <Volume2 size={12} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {remote.length === 0 && (
                <p className="muted-note">
                  {mode === "local"
                    ? "같은 브라우저에서 새 탭으로 들어와 보세요."
                    : "이 공간에 들어오는 친구를 기다려요."}
                </p>
              )}
            </div>
            <div className="sidebar-block emotes-block">
              <h3 className="sidebar-title">가볍게 표현해요</h3>
              <div className="emote-grid">
                {Object.entries(emotes).map(([kind, value]) => (
                  <button
                    key={kind}
                    className={currentEmote === kind ? "active" : ""}
                    onClick={() => emote(kind as Emote)}
                    disabled={!!currentEmote}
                    aria-label={value.label}
                  >
                    <span>{value.icon}</span>
                    <b>{value.label}</b>
                    <kbd>{value.key}</kbd>
                  </button>
                ))}
              </div>
            </div>
            <section className="chat-panel" aria-label="공간 채팅">
              <div className="sidebar-title">
                <h3>
                  <MessageCircle size={15} /> 이 공간의 대화
                </h3>
                <span>{messages.length}</span>
              </div>
              <div className="chat-messages" role="log" aria-live="polite">
                {messages.length === 0 && (
                  <p className="chat-empty">
                    첫 인사를 건네보세요 👋
                    <br />
                    <small>
                      최근 10분만 보여요. 퇴장하면 내 메시지도 사라져요.
                    </small>
                  </p>
                )}
                {messages.map((m) => (
                  <article
                    key={messageKey(m)}
                    className={
                      m.uid === uid ? "chat-message own" : "chat-message"
                    }
                  >
                    <header>
                      <b>{m.nickname}</b>
                      <time>
                        {new Date(m.at).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </header>
                    <p>{m.text}</p>
                  </article>
                ))}
                <div ref={chatEnd} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <textarea
                  ref={chatInput}
                  aria-label="채팅 메시지"
                  placeholder="Enter로 대화 시작…"
                  value={draft}
                  maxLength={200}
                  rows={2}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing &&
                      e.nativeEvent.keyCode !== 229
                    ) {
                      e.preventDefault();
                      void send();
                    }
                    if (e.key === "Escape") e.currentTarget.blur();
                  }}
                />
                <div className="chat-compose-bottom">
                  <span>{draft.length}/200</span>
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    aria-label="메시지 보내기"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </section>
            <div className="quality-control">
              <SlidersHorizontal size={15} />
              <label htmlFor="quality">그래픽</label>
              <select
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="normal">기본 · 그림자 켜기</option>
                <option value="low">가볍게 · 그림자 끄기</option>
              </select>
            </div>
            <div className="local-notice">
              <span />
              {mode === "local"
                ? "로컬 탭 연결 · 다른 기기에서는 연결되지 않아요."
                : mode === "emulator"
                  ? "Firebase 에뮬레이터 · 실제 공개 서버가 아닙니다."
                  : "Firebase 실시간 연결"}
            </div>
          </aside>
        </main>
      )}
      {social.error && (
        <div className="error-toast" role="alert">
          {social.error}
          <button
            onClick={() => social.setError("")}
            aria-label="오류 안내 닫기"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-btn"
              onClick={() => setHelp(false)}
              aria-label="도움말 닫기"
            >
              <X size={20} />
            </button>
            <p className="eyebrow">WELCOME TO YOUR LITTLE WORLD</p>
            <h2 id="help-title">작은 세상을 함께 즐겨요.</h2>
            <p>
              방향키나 화면 방향 버튼을 누르고 걷고 Enter로 채팅해요. 숫자 1은
              손 흔들기, 2는 놀라기, 3은 기뻐하기, 4는 춤추기, 5는 박수치기, 6은
              하트 보내기입니다. 소품 가까이에서 E 키나 화면 버튼을 눌러
              사용하고, 이동하면 소품 동작이 끝나요.
            </p>
            <ul>
              <li>참가자 옆 ✊ 버튼: 가위바위보 초대</li>
              <li>참가자 옆 ● 버튼: 오목 초대</li>
              <li>참가자 옆 스피커: 음소거</li>
              <li>맵 선택 메뉴: 다른 공간으로 이동</li>
            </ul>
            <p className="muted-note">
              {mode === "local"
                ? "로컬 모드는 같은 브라우저의 탭·창끼리만 연결됩니다. 실제 Firebase와 연결하려면 환경변수를 설정한 후 온라인 모드를 사용해 주세요."
                : "익명 로그인은 이 탭에 저장됩니다. 저장 정보 삭제 시 계정이 초기화됩니다."}{" "}
              공개 서버에는 서버 운영 및 신고 대응이 필요합니다.
            </p>
            <button className="enter-button" onClick={() => setHelp(false)}>
              알겠어요 <Check size={17} />
            </button>
          </section>
        </div>
      )}
      {!help && game && social.service && (
        <GamePanel
          key={game.id}
          game={game}
          backend={social.service}
          players={players}
          now={social.now}
          onClose={() => setClosed((v) => new Set([...v, game.id]))}
          onError={onError}
        />
      )}
    </div>
  );
}
