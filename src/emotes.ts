export type Emote = "wave" | "surprise" | "joy";
export const emotes: Record<
  Emote,
  { label: string; icon: string; key: string }
> = {
  wave: { label: "손 흔들기", icon: "👋", key: "1" },
  surprise: { label: "놀라기", icon: "❗", key: "2" },
  joy: { label: "기뻐하기", icon: "✨", key: "3" },
};
export const EMOTE_DURATION = 3200;
export function motion(t: number, emote?: Emote) {
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
