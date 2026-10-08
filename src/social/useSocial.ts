import { useCallback, useEffect, useRef, useState } from "react";
import type { Point, Profile } from "../model";
import { LocalBackend } from "./local";
import { emptyRoom, type Backend, type RoomState } from "./types";
export const requestedMode = new URLSearchParams(location.search).get("mode");
export const mode =
  requestedMode === "emulator" && import.meta.env.DEV
    ? "emulator"
    : requestedMode === "local"
      ? "local"
      : import.meta.env.VITE_FIREBASE_API_KEY
        ? "online"
        : "local";
let backendPromise: Promise<Backend> | null = null;
function backend() {
  return (backendPromise ??=
    mode === "local"
      ? Promise.resolve(new LocalBackend())
      : import("./firebase").then((m) =>
          m.createFirebase(mode === "emulator"),
        ));
}
export default function useSocial() {
  const [service, setService] = useState<Backend | null>(null),
    [state, setState] = useState<RoomState>(emptyRoom),
    [room, setRoom] = useState<string | null>(null),
    [status, setStatus] = useState("연결 준비 중"),
    [counts, setCounts] = useState<Record<string, number>>({}),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now());
  const last = useRef({ x: NaN, z: NaN, rotation: NaN, walking: false });
  useEffect(() => {
    let alive = true,
      stop = () => {};
    void backend()
      .then((b) => {
        if (!alive) return;
        setService(b);
        setStatus(
          mode === "local" ? "같은 브라우저 탭끼리 연결" : "연결 준비됨",
        );
        stop = b.counts(setCounts);
      })
      .catch((e) => {
        if (alive) {
          setError(`연결 준비 실패: ${e.message}`);
          setStatus("연결 실패");
        }
      });
    return () => {
      alive = false;
      stop();
    };
  }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(service?.now() ?? Date.now()), 400);
    return () => clearInterval(t);
  }, [service]);
  useEffect(() => {
    if (!service || !room) return;
    const stop = service.watch(setState, setStatus);
    return stop;
  }, [service, room]);
  const join = useCallback(
    async (id: string, profile: Profile) => {
      if (!service)
        throw new Error("연결을 준비하고 있어요. 잠시 후 다시 시도해 주세요.");
      setError("");
      await service.join(id, profile);
      last.current = { x: NaN, z: NaN, rotation: NaN, walking: false };
      setState(emptyRoom());
      setRoom(id);
    },
    [service],
  );
  const leave = useCallback(async () => {
    setRoom(null);
    setState(emptyRoom());
    try {
      await service?.leave();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [service]);
  const movement = useCallback(
    (p: Point, rotation: number, walking: boolean) => {
      const previous = last.current;
      if (
        previous.x === p.x &&
        previous.z === p.z &&
        previous.rotation === rotation
      )
        return;
      last.current = { ...p, rotation, walking };
      void service?.move(p, rotation).catch((e) => setError(e.message));
    },
    [service],
  );
  return {
    service,
    state,
    room,
    status,
    counts,
    error,
    setError,
    now,
    join,
    leave,
    movement,
  };
}
