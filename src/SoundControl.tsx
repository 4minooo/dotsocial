import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sound, type SoundMap } from "./sound";
export default function SoundControl({ map }: { map: string | null }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem("dot-social.sound") !== "off";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    const update = () =>
      sound.configure(map as SoundMap | null, enabled, document.hidden);
    const unlock = () => void sound.unlock();
    update();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", update);
      sound.configure(null, enabled);
    };
  }, [map, enabled]);
  return (
    <button
      className="sound-control"
      aria-label={enabled ? "배경음과 효과음 끄기" : "배경음과 효과음 켜기"}
      aria-pressed={enabled}
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        sound.configure(map as SoundMap | null, next, document.hidden);
        if (next) void sound.unlock();
        try {
          localStorage.setItem("dot-social.sound", next ? "on" : "off");
        } catch {
          /* Optional preference. */
        }
      }}
    >
      {enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
      <span>소리 {enabled ? "켜짐" : "꺼짐"}</span>
    </button>
  );
}
