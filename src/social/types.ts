import type { Point, Profile } from "../model";
import type { Emote } from "../emotes";
export type Player = Point & {
  uid: string;
  session: string;
  slot: number;
  profile: Profile;
  rotation: number;
  at: number;
  emote: { kind: Emote | "none"; at: number };
};
export type Message = {
  uid: string;
  session: string;
  nickname: string;
  text: string;
  at: number;
};
export type Roster = {
  uid: string;
  session: string;
  joinedAt: number;
  live?: Record<string, boolean>;
};
export type Choice = "rock" | "paper" | "scissors";
export type Stone = { uid: string; n: number };
export type Game = {
  id: string;
  slot: number;
  type: "rps" | "gomoku";
  host: string;
  guest: string;
  hostSlot: number;
  guestSlot: number;
  hostSession: string;
  guestSession: string;
  status:
    "invited" | "active" | "declined" | "cancelled" | "finished" | "aborted";
  createdAt: number;
  deadline: number;
  next: number;
  board?: Record<string, Stone>;
  commits?: Record<string, string>;
  reveals?: Record<string, { choice: Choice; salt: string }>;
};
export type RoomState = {
  players: Record<string, Player>;
  chat: Record<string, Record<string, Message>>;
  games: Record<string, Game>;
};
export const emptyRoom = (): RoomState => ({
  players: {},
  chat: {},
  games: {},
});
export interface Backend {
  mode: "local" | "emulator" | "online";
  uid: string;
  session: string;
  now(): number;
  counts(callback: (counts: Record<string, number>) => void): () => void;
  join(room: string, profile: Profile): Promise<Player>;
  leave(): Promise<void>;
  watch(
    callback: (state: RoomState) => void,
    connection: (status: string) => void,
  ): () => void;
  move(point: Point, rotation: number): Promise<void>;
  emote(kind: Emote): Promise<void>;
  chat(text: string): Promise<void>;
  invite(guest: Player, type: Game["type"], rematchId?: string): Promise<void>;
  mutate(id: string, change: (game: Game) => Game): Promise<void>;
}
