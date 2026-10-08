import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Sparkles,
  Users,
  MapPin,
  Gamepad2,
  Hand,
} from "lucide-react";
import World from "./World";
import {
  cleanNickname,
  maps,
  palettes,
  validNickname,
  type Profile,
} from "./model";
export default function Lobby({
  profile,
  setProfile,
  selected,
  setSelected,
  wave,
  onWave,
  enter,
  joining,
  ready,
  counts,
  mode,
  storageWarning,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  selected: string;
  setSelected: (id: string) => void;
  wave: boolean;
  onWave: () => void;
  enter: () => void;
  joining: boolean;
  ready: boolean;
  counts: Record<string, number>;
  mode: string;
  storageWarning: boolean;
}) {
  const map = maps.find((m) => m.id === selected)!;
  const change = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile({ ...profile, [key]: value });
  const setWave = (_value: boolean) => onWave();
  return (
    <main className="lobby">
      <section className="welcome">
        <div>
          <p className="eyebrow">
            <span /> A LITTLE WORLD, A LITTLE CONNECTION
          </p>
          <h1>
            작은 세상에서,
            <br />
            우리 <em>만나요.</em>
            <span className="heading-star">✳</span>
          </h1>
          <p className="intro">
            가볍게 들어와, 나답게 머물러요.
            <br />
            산책하고 이야기하며 함께 노는 도트 속 일상.
          </p>
        </div>
        <div className="welcome-note">
          <span className="note-dot" /> 오늘의 작은 모험이 시작되는 곳
        </div>
      </section>
      <section className="character-card panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 · YOUR CHARACTER</p>
            <h2>오늘의 나는</h2>
          </div>
          <span className="pill">
            <Sparkles size={12} /> 나만의 도트
          </span>
        </div>
        <div className="character-layout">
          <div className="avatar-preview">
            <span className="preview-doodle">✦</span>
            <World profile={profile} preview wave={wave} />
            <button
              className="preview-wave"
              onClick={() => setWave(true)}
              aria-label="캐릭터 손 흔들기"
            >
              <Hand size={14} /> 안녕!
            </button>
            <span className="preview-label">THAT’S YOU!</span>
          </div>
          <div className="customizer">
            <label className="field-label" htmlFor="nickname">
              닉네임 <span>{cleanNickname(profile.nickname).length}/12</span>
            </label>
            <input
              id="nickname"
              value={profile.nickname}
              onChange={(e) => change("nickname", e.target.value)}
              maxLength={20}
              placeholder="어떻게 불러드릴까요?"
              aria-invalid={!validNickname(profile.nickname)}
              autoComplete="off"
            />
            {!validNickname(profile.nickname) && (
              <p className="field-error">
                한글·영문·숫자 2~12자로 입력해 주세요.
              </p>
            )}
            <div className="custom-row">
              <span>헤어</span>
              <div className="segmented">
                {(
                  [
                    ["short", "짧은"],
                    ["bob", "단발"],
                    ["spiky", "뾰족"],
                    ["long", "긴머리"],
                  ] as const
                ).map(([v, t]) => (
                  <button
                    key={v}
                    className={profile.hairstyle === v ? "active" : ""}
                    onClick={() => change("hairstyle", v)}
                    aria-pressed={profile.hairstyle === v}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {(["hair", "shirt", "pants"] as const).map((part) => (
              <div className="custom-row" key={part}>
                <span>
                  {{ hair: "머리 색", shirt: "상의", pants: "하의" }[part]}
                </span>
                <div className="swatches">
                  {palettes[part].map((color, i) => (
                    <button
                      key={color}
                      className={
                        profile[part] === i ? "swatch active" : "swatch"
                      }
                      style={{ backgroundColor: color }}
                      aria-label={`${{ hair: "머리", shirt: "상의", pants: "하의" }[part]} 색상 ${i + 1}`}
                      aria-pressed={profile[part] === i}
                      onClick={() => change(part, i)}
                    >
                      {profile[part] === i && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="custom-row">
              <span>액세서리</span>
              <div className="segmented">
                {(
                  [
                    ["none", "없음"],
                    ["cap", "모자"],
                    ["glasses", "안경"],
                  ] as const
                ).map(([v, t]) => (
                  <button
                    key={v}
                    className={profile.accessory === v ? "active" : ""}
                    onClick={() => change("accessory", v)}
                    aria-pressed={profile.accessory === v}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className={storageWarning ? "save-note field-error" : "save-note"}>
          <span />
          {storageWarning
            ? "브라우저 저장을 사용할 수 없어 설정이 유지되지 않습니다."
            : "캐릭터 설정은 이 브라우저에 자동으로 저장돼요."}
        </p>
      </section>
      <section className="spaces">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 · FIND YOUR SPACE</p>
            <h2>어디서 만날까요?</h2>
          </div>
          <span className="spaces-note">5개의 작은 공간</span>
        </div>
        <div className="map-grid">
          {maps.map((m) => (
            <button
              key={m.id}
              className={`map-card ${selected === m.id ? "selected" : ""}`}
              onClick={() => setSelected(m.id)}
              aria-pressed={selected === m.id}
            >
              <span className="map-art" style={{ backgroundColor: m.color }}>
                <span className="map-icon">{m.icon}</span>
                <span className="map-number">0{maps.indexOf(m) + 1}</span>
                <span className="map-label">{m.label}</span>
                {selected === m.id && (
                  <span className="map-check">
                    <Check size={13} />
                  </span>
                )}
              </span>
              <span className="map-body">
                <b>{m.name}</b>
                <small>{m.tag}</small>
                <span className="map-status">
                  <span className={"status-dot"} />
                  {`${counts[m.id] ?? 0}/8명 · 입장 가능`}
                  <ChevronRight size={13} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="park-preview panel">
        <div className="park-render">
          <World profile={profile} map={selected} />
          <span className="scene-label">
            <MapPin size={13} /> {`${map.name} · 미리보기`}
          </span>
          <span className="scene-corner">한 걸음 쉬어 가요.</span>
        </div>
        <div className="entry">
          <span className="eyebrow">YOUR NEXT LITTLE ADVENTURE</span>
          <h3>{map.name}</h3>
          <p>{map.description}</p>
          <div className="entry-meta">
            <span>
              <Users size={14} />{" "}
              {`${counts[selected] ?? 0}/8명 · ${mode === "local" ? "로컬 탭 연결" : "실시간 연결"}`}
            </span>
            <span>
              <Gamepad2 size={14} /> 가위바위보 · 오목
            </span>
          </div>
          <button
            className="enter-button"
            disabled={!validNickname(profile.nickname) || joining || !ready}
            onClick={enter}
          >
            {joining ? "입장 중…" : `${map.name} 입장하기`}
            <ArrowUpRight size={20} />
          </button>
          <p className="entry-note">
            {"방향키로 걷고, 친구들과 이야기해 보세요."}
          </p>
        </div>
      </section>
      <footer className="footer">
        <span>
          작은 도트, 큰 이야기. <span>© 2026 DOT SOCIAL</span>
        </span>
        <span>
          {mode === "local"
            ? "로컬 연결 · 같은 브라우저에서 탭을 추가해 보세요."
            : "실시간 연결 · 다른 사람과 함께 즐겨요."}
        </span>
      </footer>
    </main>
  );
}
