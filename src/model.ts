export const palettes = {
  hair: [
    "#463331",
    "#8b573b",
    "#dbc08a",
    "#303244",
    "#b68cc6",
    "#e8ddd0",
    "#c97e9c",
    "#659f98",
  ],
  shirt: [
    "#9e8ad1",
    "#749e82",
    "#e6a37d",
    "#729db7",
    "#e6c869",
    "#f4eee5",
    "#373d4d",
    "#d77586",
  ],
  pants: [
    "#494b64",
    "#657578",
    "#805e52",
    "#d7cab0",
    "#3e596c",
    "#ebded7",
    "#282c35",
    "#97ad8a",
  ],
  skin: ["#efbf99", "#f9dac4", "#d89c73", "#af7857", "#785340"],
  accessoryColor: [
    "#749e82",
    "#9e8ad1",
    "#e6a37d",
    "#729db7",
    "#e6c869",
    "#f4eee5",
    "#373d4d",
    "#d77586",
  ],
};
export type Profile = {
  nickname: string;
  hair: number;
  shirt: number;
  pants: number;
  hairstyle: "short" | "bob" | "spiky" | "long";
  accessory:
    "none" | "cap" | "glasses" | "headphones" | "ribbon" | "backpack" | "crown";
  skin: number;
  accessoryColor: number;
  face: "friendly" | "smile" | "sleepy" | "wink" | "bold";
};
export const defaultProfile: Profile = {
  nickname: "도트친구",
  hair: 0,
  shirt: 0,
  pants: 0,
  hairstyle: "short",
  accessory: "none",
  skin: 0,
  accessoryColor: 0,
  face: "friendly",
};
export const storageKey = "dot-social.profile.v1";
export function cleanNickname(value: string) {
  return value.replace(/\s/g, "");
}
export function validNickname(value: string) {
  return /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]{2,12}$/.test(cleanNickname(value));
}
export function loadProfile(): Profile {
  try {
    const p = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (!p || typeof p.nickname !== "string") return { ...defaultProfile };
    return {
      nickname: validNickname(p.nickname)
        ? cleanNickname(p.nickname)
        : defaultProfile.nickname,
      hair: validIndex(p.hair, 8),
      shirt: validIndex(p.shirt, 8),
      pants: validIndex(p.pants, 8),
      skin: validIndex(p.skin, 5),
      accessoryColor: validIndex(p.accessoryColor, 8),
      face: ["friendly", "smile", "sleepy", "wink", "bold"].includes(p.face)
        ? p.face
        : "friendly",
      hairstyle: ["short", "bob", "spiky", "long"].includes(p.hairstyle)
        ? p.hairstyle
        : "short",
      accessory: [
        "none",
        "cap",
        "glasses",
        "headphones",
        "ribbon",
        "backpack",
        "crown",
      ].includes(p.accessory)
        ? p.accessory
        : "none",
    };
  } catch {
    return { ...defaultProfile };
  }
}
function validIndex(n: unknown, length: number) {
  return Number.isInteger(n) && Number(n) >= 0 && Number(n) < length
    ? Number(n)
    : 0;
}
export type Point = { x: number; z: number };
export type Obstacle = Point & { w: number; d: number };
export const trees: Point[] = [
  { x: -6, z: -5 },
  { x: -3.8, z: -6 },
  { x: 1.5, z: -6 },
  { x: 5.8, z: -5 },
  { x: -6, z: 1 },
  { x: -5.8, z: 5 },
  { x: 5.8, z: 4.8 },
];
export const benches: Point[] = [
  { x: -3.7, z: -2.8 },
  { x: 3.7, z: -2.8 },
  { x: 3.7, z: 3 },
];
export const lamps: Point[] = [
  { x: -2, z: 5 },
  { x: 2, z: -5 },
  { x: 5, z: 1.5 },
  { x: -6, z: -2 },
];
export const obstacles: Obstacle[] = [
  ...trees.map((p) => ({ ...p, w: 1.35, d: 1.35 })),
  ...benches.map((p) => ({ ...p, w: 2.1, d: 0.85 })),
  ...lamps.map((p) => ({ ...p, w: 0.15, d: 0.15 })),
  { x: 0, z: -3, w: 2.8, d: 2.8 },
  { x: -3.8, z: 3.8, w: 2, d: 1.7 },
  { x: 2.2, z: 5.6, w: 1.15, d: 0.2 },
];
export const spawn: Point = { x: 0, z: 2.8 };
export function blocked(p: Point, blocks: Obstacle[] = obstacles) {
  const r = 0.3;
  return (
    Math.abs(p.x) > 6.7 ||
    Math.abs(p.z) > 6.7 ||
    blocks.some(
      (b) =>
        Math.abs(p.x - b.x) < b.w / 2 + r && Math.abs(p.z - b.z) < b.d / 2 + r,
    )
  );
}
export function move(
  p: Point,
  sx: number,
  sy: number,
  delta: number,
  blocks = obstacles,
): Point {
  // Camera looks from +x,+z. Right = (+x,-z), screen up = (-x,-z).
  const length = Math.hypot(sx, sy);
  if (!length) return p;
  const distance = 2.6 * Math.min(Math.max(delta, 0), 0.05);
  const dx = ((sx - sy) / length / Math.SQRT2) * distance;
  const dz = ((-sx - sy) / length / Math.SQRT2) * distance;
  const next = { ...p };
  if (!blocked({ x: next.x + dx, z: next.z }, blocks)) next.x += dx;
  if (!blocked({ x: next.x, z: next.z + dz }, blocks)) next.z += dz;
  return next;
}
export const maps = [
  {
    id: "campus",
    name: "부경대학교 백경광장",
    tag: "벚꽃길에서 만나는 캠퍼스",
    icon: "🌸",
    color: "#eee0e5",
    label: "PKNU",
    description: "벚꽃 아래, 우리들의 캠퍼스 산책.",
  },
  {
    id: "park",
    name: "느긋한 공원",
    tag: "산책하기 좋은 오후",
    icon: "🌳",
    color: "#dae5c6",
    label: "PARK",
    description: "나무 그늘 아래, 잠깐 쉬어 가요.",
  },
  {
    id: "rooftop",
    name: "노을빛 옥상",
    tag: "도시 위의 작은 쉼터",
    icon: "🌇",
    color: "#ead7ca",
    label: "ROOFTOP",
    description: "도시의 노을을 함께 바라봐요.",
  },
  {
    id: "office",
    name: "바쁜 사무실",
    tag: "바쁘다 바빠 현대사회",
    icon: "💼",
    color: "#d4dfeb",
    label: "OFFICE",
    description: "일상 속 가벼운 대화를 나눠요.",
  },
  {
    id: "cafe",
    name: "모퉁이 카페",
    tag: "커피 향이 가득한 곳",
    icon: "☕",
    color: "#e8dbc4",
    label: "CAFE",
    description: "따뜻한 한 잔과 새로운 만남.",
  },
  {
    id: "beach",
    name: "작은 해변",
    tag: "파도 소리와 쉬어가기",
    icon: "🏖️",
    color: "#cce4df",
    label: "BEACH",
    description: "바다 앞에서 느긋하게 쉬어요.",
  },
];
