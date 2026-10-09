import data from "./moderation-pattern.json";
const blocked = new RegExp(data.pattern, "i");
const strip = new Set(data.strip);
export function hasProfanity(text: string) {
  const clean = (s: string) => [...s].filter((c) => !strip.has(c)).join("");
  return (
    blocked.test(clean(text)) || blocked.test(clean(text.normalize("NFKC")))
  );
}
export function validateChat(text: string) {
  if (hasProfanity(text))
    throw new Error(
      "욕설이 포함된 메시지는 보낼 수 없어요. 표현을 바꿔 주세요.",
    );
}
