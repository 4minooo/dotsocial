import {
  Component,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, OrthographicCamera } from "three";
import Avatar, { Box } from "./Avatar";
import {
  benches,
  lamps,
  trees,
  move,
  spawn,
  type Point,
  type Profile,
} from "./model";
import Scenery, { mapObstacles } from "./Scenery";
import WorldLabel from "./WorldLabel";
import { EMOTE_DURATION, type Emote } from "./emotes";
import { stations, type Activity } from "./interactions";
import WorldDetails, { InteractionProps } from "./WorldDetails";
import Campus from "./Campus";
import type { Player as NetworkPlayer } from "./social/types";

function Tree({ x, z, index }: Point & { index: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.8, 0]} s={[0.35, 1.6, 0.35]} color="#99714f" />
      <Box
        p={[0, 1.9, 0]}
        s={[1.55, 1.1, 1.45]}
        color={index % 2 ? "#6f965e" : "#85a76a"}
      />
      <Box p={[-0.15, 2.5, 0]} s={[1.14, 0.65, 1.1]} color="#9abb7a" />
      <Box p={[0.4, 1.65, 0.25]} s={[0.75, 0.65, 0.75]} color="#799b60" />
      {index % 3 === 0 && (
        <>
          <Box p={[0.6, 2, 0.7]} s={[0.16, 0.16, 0.1]} color="#e9bb72" />
          <Box p={[-0.4, 2.7, 0.55]} s={[0.16, 0.16, 0.1]} color="#e9bb72" />
        </>
      )}
    </group>
  );
}
function Bench({ x, z }: Point) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.54, 0]} s={[2, 0.14, 0.7]} color="#c29465" />
      <Box p={[0, 0.91, -0.32]} s={[2, 0.55, 0.12]} color="#d5ac7d" />
      {[-0.76, 0.76].map((x) => (
        <group key={x}>
          <Box p={[x, 0.26, 0]} s={[0.13, 0.52, 0.6]} color="#647564" />
          <Box p={[x, 0.7, 0]} s={[0.13, 0.12, 0.85]} color="#647564" />
        </group>
      ))}
      {[-0.18, 0.08].map((z) => (
        <Box key={z} p={[0, 0.618, z]} s={[2, 0.015, 0.025]} color="#a47854" />
      ))}
    </group>
  );
}
function Flower({ x, z, i }: Point & { i: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.16, 0]} s={[0.035, 0.3, 0.035]} color="#78915b" />
      <Box
        p={[0, 0.32, 0]}
        s={[0.16, 0.09, 0.16]}
        color={["#e7afad", "#e7c577", "#eee7cf"][i % 3]}
      />
      <Box p={[0, 0.37, 0]} s={[0.05, 0.02, 0.05]} color="#c49162" />
    </group>
  );
}
function Park() {
  return (
    <group>
      <Box p={[0, -0.4, 0]} s={[14.5, 0.7, 14.5]} color="#b2b294" />
      <Box p={[0, -0.035, 0]} s={[14.5, 0.13, 14.5]} color="#b7ca8f" />
      <Box p={[0, 0.042, 0]} s={[2.4, 0.025, 14.4]} color="#e1d6b9" />
      <Box p={[0, 0.043, 0]} s={[14.4, 0.026, 2.2]} color="#e1d6b9" />
      {Array.from({ length: 9 }, (_, i) => (
        <Box
          key={i}
          p={[0, 0.06, -6 + i * 1.5]}
          s={[2.32, 0.008, 0.025]}
          color="#c9bfa7"
        />
      ))}
      {trees.map((p, i) => (
        <Tree key={i} {...p} index={i} />
      ))}
      {benches.map((p, i) => (
        <Bench key={i} {...p} />
      ))}
      <group position={[0, 0, -3]}>
        <Box p={[0, 0.15, 0]} s={[2.65, 0.3, 2.65]} color="#c4c8bf" />
        <Box p={[0, 0.31, 0]} s={[2.2, 0.07, 2.2]} color="#80b9bb" />
        {[-1.25, 1.25].map((x) => (
          <Box key={x} p={[x, 0.35, 0]} s={[0.17, 0.3, 2.65]} color="#e2e2d1" />
        ))}
        {[-1.25, 1.25].map((z) => (
          <Box key={z} p={[0, 0.35, z]} s={[2.65, 0.3, 0.17]} color="#e2e2d1" />
        ))}
        <Box p={[0, 0.63, 0]} s={[0.36, 1, 0.36]} color="#d7d9cc" />
        <Box p={[0, 1.06, 0]} s={[1, 0.15, 1]} color="#e9e7d5" />
        <Box p={[0, 1.15, 0]} s={[0.72, 0.06, 0.72]} color="#9bd2d0" />
        <Box p={[0, 1.42, 0]} s={[0.1, 0.5, 0.1]} color="#adddda" />
      </group>
      <group position={[-3.8, 0, 3.8]}>
        <Box p={[0, 0.2, 0]} s={[2, 0.4, 1.7]} color="#c89a74" />
        <Box p={[0, 0.405, 0]} s={[1.8, 0.04, 1.5]} color="#776d51" />
        <group position={[0, 0.42, 0]}>
          {Array.from({ length: 12 }, (_, i) => (
            <Flower
              key={i}
              x={-0.65 + (i % 4) * 0.43}
              z={-0.5 + Math.floor(i / 4) * 0.45}
              i={i}
            />
          ))}
        </group>
      </group>
      {lamps.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <Box p={[0, 1, 0]} s={[0.12, 2, 0.12]} color="#737c6f" />
          <Box p={[0, 2.07, 0]} s={[0.4, 0.45, 0.4]} color="#fff0bf" />
          <Box p={[0, 2.34, 0]} s={[0.56, 0.12, 0.56]} color="#737c6f" />
        </group>
      ))}
      {Array.from({ length: 35 }, (_, i) => {
        const x = Math.sin(i * 17) * 6.6,
          z = Math.cos(i * 13) * 6.6;
        return Math.abs(x) > 1.5 && Math.abs(z) > 1.5 ? (
          <Flower key={i} x={x} z={z} i={i} />
        ) : null;
      })}
      {[-6.95, 6.95].map((z) => (
        <group key={z}>
          <Box p={[0, 0.4, z]} s={[14.2, 0.09, 0.09]} color="#d7d3b8" />
          {Array.from({ length: 10 }, (_, i) => (
            <Box
              key={i}
              p={[-6.6 + i * 1.47, 0.25, z]}
              s={[0.12, 0.55, 0.12]}
              color="#e7e1c8"
            />
          ))}
        </group>
      ))}
      <group position={[2.2, 0, 5.6]}>
        <Box p={[0, 0.55, 0]} s={[0.12, 1.1, 0.12]} color="#987955" />
        <Box p={[0, 1.13, 0]} s={[1.15, 0.65, 0.13]} color="#ddc8a0" />
        <Box p={[0, 1.15, 0.07]} s={[0.66, 0.1, 0.02]} color="#73876b" />
        <Box p={[-0.26, 1.01, 0.07]} s={[0.16, 0.07, 0.02]} color="#73876b" />
      </group>
    </group>
  );
}
function CameraFit({ preview = false }: { preview?: boolean }) {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    if (camera instanceof OrthographicCamera) {
      camera.position.set(
        preview ? 4 : 14,
        preview ? 2.8 : 13,
        preview ? 6 : 14,
      );
      camera.lookAt(0, preview ? 0.85 : 0.3, 0);
      camera.zoom = preview
        ? Math.min(size.width / 3.3, size.height / 2.6)
        : Math.min(size.width / 22, size.height / 18);
      camera.updateProjectionMatrix();
    }
  }, [camera, size, preview]);
  return null;
}
function Player({
  profile,
  playing,
  paused,
  wave,
  emote,
  message,
  map,
  onMove,
  touchKeys,
  activity,
}: {
  profile: Profile;
  playing: boolean;
  paused: boolean;
  wave: boolean;
  emote?: Emote;
  message?: string;
  map: string;
  onMove?: (p: Point, rotation: number, walking: boolean) => void;
  touchKeys?: Set<string>;
  activity?: Activity;
}) {
  const group = useRef<Group>(null),
    pos = useRef<Point>({ ...spawn }),
    keys = useRef(new Set<string>()),
    moving = useRef(false),
    [walking, setWalking] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    keys.current.clear();
    if (!playing || paused) return;
    const editable = () => {
      const el = document.activeElement;
      return (
        el instanceof HTMLElement &&
        (el.matches("input,textarea,select") ||
          el.isContentEditable ||
          !!el.closest('[role="dialog"]'))
      );
    };
    const down = (e: KeyboardEvent) => {
      if (editable()) {
        keys.current.clear();
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        keys.current.add(e.key);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    document.addEventListener("focusin", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
      document.removeEventListener("focusin", clear);
      clear();
    };
  }, [playing, paused]);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    if (!playing) {
      group.current.rotation.y = -0.25;
      return;
    }
    const sx =
        Number(
          !paused &&
            (keys.current.has("ArrowRight") || touchKeys?.has("ArrowRight")),
        ) -
        Number(
          !paused &&
            (keys.current.has("ArrowLeft") || touchKeys?.has("ArrowLeft")),
        ),
      sy =
        Number(
          !paused && (keys.current.has("ArrowUp") || touchKeys?.has("ArrowUp")),
        ) -
        Number(
          !paused &&
            (keys.current.has("ArrowDown") || touchKeys?.has("ArrowDown")),
        );
    const next = move(pos.current, sx, sy, delta, mapObstacles(map)),
      dx = next.x - pos.current.x,
      dz = next.z - pos.current.z;
    const isMoving = Math.hypot(dx, dz) > 0.0001;
    if (isMoving) group.current.rotation.y = Math.atan2(dx, dz);
    else if (emote || wave) {
      const turn = Math.PI / 4 - group.current.rotation.y;
      group.current.rotation.y +=
        Math.atan2(Math.sin(turn), Math.cos(turn)) *
        (1 - Math.exp(-delta * 12));
    }
    const seat =
      activity && ["sit", "type"].includes(activity.kind) && !isMoving
        ? stations.find((s) => s.id === activity.id)
        : undefined;
    group.current.position.set(seat?.x ?? next.x, 0, seat?.z ?? next.z);
    if (seat) group.current.rotation.y = 0;
    else if (activity && !isMoving) {
      const target = stations.find((s) => s.id === activity.id);
      if (target)
        group.current.rotation.y = Math.atan2(
          target.x - next.x,
          target.z - next.z,
        );
    }
    pos.current = next;
    const changed = isMoving !== moving.current;
    if (changed) {
      moving.current = isMoving;
      setWalking(isMoving);
    }
    if (changed || clock.elapsedTime - last.current > 0.2) {
      onMove?.(next, group.current.rotation.y, isMoving);
      last.current = clock.elapsedTime;
    }
  });
  return (
    <group ref={group} position={playing ? [spawn.x, 0, spawn.z] : [0, 0, 0]}>
      <group scale={playing ? 1.15 : 1}>
        <Avatar
          profile={profile}
          walking={walking}
          wave={wave}
          emote={emote}
          activity={walking ? undefined : activity?.kind}
        />
      </group>
      {playing && (
        <WorldLabel
          anchor={group}
          nickname={profile.nickname}
          emote={emote ?? (wave ? "wave" : undefined)}
          message={message}
          activity={
            activity
              ? stations.find((s) => s.id === activity.id)?.label
              : undefined
          }
        />
      )}
    </group>
  );
}
function RemotePlayer({
  player,
  time,
  message,
}: {
  player: NetworkPlayer;
  time: number;
  message?: string;
}) {
  const group = useRef<Group>(null),
    [walking, setWalking] = useState(false),
    moving = useRef(false),
    initial = useRef<[number, number, number]>([player.x, 0, player.z]);
  useFrame((_, delta) => {
    if (!group.current) return;
    const g = group.current,
      distance = Math.hypot(g.position.x - player.x, g.position.z - player.z),
      blend = 1 - Math.exp(-delta * 14);
    const seat =
      player.activity && ["sit", "type"].includes(player.activity.kind)
        ? stations.find((s) => s.id === player.activity?.id)
        : undefined;
    g.position.x += ((seat?.x ?? player.x) - g.position.x) * blend;
    g.position.z += ((seat?.z ?? player.z) - g.position.z) * blend;
    g.rotation.y +=
      Math.atan2(
        Math.sin((seat ? 0 : player.rotation) - g.rotation.y),
        Math.cos((seat ? 0 : player.rotation) - g.rotation.y),
      ) * blend;
    const m = !player.activity && distance > 0.035;
    if (m !== moving.current) {
      moving.current = m;
      setWalking(m);
    }
  });
  const emote =
    player.emote.kind !== "none" && time - player.emote.at < EMOTE_DURATION
      ? player.emote.kind
      : undefined;
  return (
    <group ref={group} position={initial.current}>
      <group scale={1.15}>
        <Avatar
          profile={player.profile}
          walking={walking}
          emote={emote}
          activity={player.activity?.kind}
        />
      </group>
      <WorldLabel
        anchor={group}
        nickname={player.profile.nickname}
        emote={emote}
        message={message}
        activity={
          player.activity
            ? stations.find((s) => s.id === player.activity?.id)?.label
            : undefined
        }
      />
    </group>
  );
}
class RenderBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="canvas-fallback">
        <b>3D 화면을 열 수 없어요</b>
        <p>브라우저의 하드웨어 가속을 켠 뒤 새로고침해 주세요.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function World({
  profile,
  preview = false,
  playing = false,
  paused = false,
  wave = false,
  emote,
  map = "park",
  players = [],
  time = Date.now(),
  messages = {},
  message,
  quality = "normal",
  onMove,
  touchKeys,
  activity,
}: {
  profile: Profile;
  preview?: boolean;
  playing?: boolean;
  paused?: boolean;
  wave?: boolean;
  emote?: Emote;
  map?: string;
  players?: NetworkPlayer[];
  time?: number;
  messages?: Record<string, string>;
  message?: string;
  quality?: string;
  onMove?: (p: Point, rotation: number, walking: boolean) => void;
  touchKeys?: Set<string>;
  activity?: Activity;
}) {
  return (
    <RenderBoundary>
      <Canvas
        orthographic
        camera={{ position: [14, 13, 14], zoom: 35, near: 0.1, far: 100 }}
        dpr={quality === "low" ? 0.65 : [1, 1.5]}
        shadows={quality !== "low"}
        gl={{
          antialias: quality !== "low",
          alpha: true,
          powerPreference: "high-performance",
        }}
        fallback={
          <div className="canvas-fallback">
            WebGL을 지원하는 브라우저가 필요합니다.
          </div>
        }
      >
        <CameraFit preview={preview} />
        <ambientLight intensity={1.1} />
        <hemisphereLight
          args={[map === "rooftop" ? "#ffdac5" : "#f5f0e7", "#8b9480", 1.2]}
        />
        <directionalLight
          position={[-5, 12, 6]}
          intensity={1.7}
          color={map === "rooftop" ? "#ffd0ac" : "#fff3db"}
          castShadow={quality !== "low"}
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-normalBias={0.04}
        />
        {preview ? (
          <>
            <Box p={[0, -0.16, 0]} s={[2.6, 0.28, 2.6]} color="#cfcae2" />
            <Box p={[0, -0.01, 0]} s={[2.6, 0.035, 2.6]} color="#e6e1f1" />
          </>
        ) : map === "campus" ? (
          <Campus />
        ) : map === "park" ? (
          <Park />
        ) : (
          <Scenery map={map} />
        )}
        {!preview && (
          <>
            <WorldDetails map={map} low={quality === "low"} />
            <InteractionProps map={map} />
          </>
        )}
        {(preview || playing) && (
          <Player
            profile={profile}
            playing={playing}
            paused={paused}
            wave={wave}
            emote={emote}
            message={message}
            map={map}
            onMove={onMove}
            touchKeys={touchKeys}
            activity={activity}
          />
        )}
        {playing &&
          players.map((p) => (
            <RemotePlayer
              key={p.session}
              player={p}
              time={time}
              message={messages[p.uid]}
            />
          ))}
      </Canvas>
    </RenderBoundary>
  );
}
