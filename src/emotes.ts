export type Emote = "wave" | "surprise" | "joy" | "dance" | "clap" | "love";
export const emotes: Record<
  Emote,
  { label: string; icon: string; key: string }
> = {
  wave: { label: "손 흔들기", icon: "👋", key: "1" },
  surprise: { label: "놀라기", icon: "❗", key: "2" },
  joy: { label: "기뻐하기", icon: "✨", key: "3" },
  dance: { label: "춤추기", icon: "🎵", key: "4" },
  clap: { label: "박수치기", icon: "👏", key: "5" },
  love: { label: "하트 보내기", icon: "💗", key: "6" },
};
export const EMOTE_DURATION = 3200;
export function motion(t: number, emote?: Emote) {
  if (emote === "dance")
    return {
      arm: 1.6 + Math.sin(t * 9) * 0.8,
      leftArm: -1.6 + Math.sin(t * 9) * 0.8,
      jump: Math.abs(Math.sin(t * 9)) * 0.15,
      tilt: Math.sin(t * 9) * 0.22,
    };
  if (emote === "clap")
    return {
      arm: -0.65 + Math.sin(t * 14) * 0.25,
      leftArm: 0.65 - Math.sin(t * 14) * 0.25,
      jump: 0,
      tilt: 0,
    };
  if (emote === "love")
    return {
      arm: 2.85,
      leftArm: -2.85,
      jump: Math.abs(Math.sin(t * 5)) * 0.12,
      tilt: Math.sin(t * 5) * 0.1,
    };
  return {
    arm:
      emote === "wave"
        ? 2.45 + Math.sin(t * 13) * 0.85
        : emote === "surprise"
          ? 2.35
          : emote === "joy"
            ? 2.65 + Math.sin(t * 10) * 0.35
            : 0.08,
    leftArm:
      emote === "surprise"
        ? -2.35
        : emote === "joy"
          ? -2.65 - Math.sin(t * 10) * 0.35
          : -0.08,
    jump:
      emote === "joy"
        ? Math.abs(Math.sin(t * 8)) * 0.42
        : emote === "surprise"
          ? Math.abs(Math.sin(t * 6)) * 0.16
          : 0,
    tilt: emote === "wave" ? Math.sin(t * 6) * 0.13 : 0,
  };
}
