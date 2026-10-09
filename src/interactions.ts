import data from "./interaction-data.json";
import type { Point } from "./model";
export type ActivityKind =
  "sit" | "water" | "look" | "type" | "sip" | "build" | "read";
export type Activity = { id: string; kind: ActivityKind; at: number };
export type Station = Point & {
  id: string;
  map: string;
  label: string;
  icon: string;
  kind: ActivityKind;
};
export const stations = data as Station[];
export const INTERACTION_RANGE = 2.15;
export function nearbyStation(map: string, p: Point) {
  return stations
    .filter(
      (s) =>
        s.map === map && Math.hypot(s.x - p.x, s.z - p.z) <= INTERACTION_RANGE,
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
    )[0];
}
export function interaction(
  map: string,
  p: Point,
  id: string,
  now: number,
): Activity {
  const s = stations.find((s) => s.map === map && s.id === id);
  if (!s || Math.hypot(s.x - p.x, s.z - p.z) > INTERACTION_RANGE)
    throw new Error("소품 가까이 이동해 주세요.");
  return { id: s.id, kind: s.kind, at: now };
}
