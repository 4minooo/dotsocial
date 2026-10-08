import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { palettes, type Profile } from "./model";
import { motion, type Emote } from "./emotes";
export function Box({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color,
  ...rest
}: {
  p?: [number, number, number];
  s?: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={p} {...rest} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}
export default function Avatar({
  profile,
  walking = false,
  wave = false,
  emote,
}: {
  profile: Profile;
  walking?: boolean;
  wave?: boolean;
  emote?: Emote;
}) {
  const left = useRef<Group>(null),
    right = useRef<Group>(null),
    legs = useRef<Group>(null),
    body = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pose = motion(t, emote ?? (wave ? "wave" : undefined));
    if (body.current) {
      body.current.position.y = pose.jump;
      body.current.rotation.z = pose.tilt;
    }
    if (left.current)
      left.current.rotation.x = walking ? Math.sin(t * 12) * 0.55 : 0;
    if (left.current) left.current.rotation.z = pose.leftArm;
    if (right.current) {
      right.current.rotation.x = walking ? -Math.sin(t * 12) * 0.55 : -0.25;
      right.current.rotation.z = pose.arm;
    }
    if (legs.current) {
      legs.current.children[0].rotation.x = walking
        ? -Math.sin(t * 12) * 0.5
        : 0;
      legs.current.children[1].rotation.x = walking
        ? Math.sin(t * 12) * 0.5
        : 0;
    }
  });
  const hair = palettes.hair[profile.hair],
    shirt = palettes.shirt[profile.shirt],
    pants = palettes.pants[profile.pants],
    skin = "#efbf99";
  return (
    <group ref={body}>
      <group ref={legs} position={[0, 0.48, 0]}>
        {[-0.17, 0.17].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Box p={[0, -0.19, 0]} s={[0.25, 0.4, 0.28]} color={pants} />
            <Box p={[0, -0.39, 0.045]} s={[0.28, 0.15, 0.4]} color="#faf3df" />
            <Box p={[0, -0.46, 0.045]} s={[0.29, 0.05, 0.4]} color="#bbb3a9" />
          </group>
        ))}
      </group>
      <Box p={[0, 0.77, 0]} s={[0.64, 0.6, 0.36]} color={shirt} />
      <Box p={[0, 0.7, 0.19]} s={[0.15, 0.12, 0.025]} color="#f2e8ce" />
      <group ref={left} position={[-0.43, 1.04, 0]}>
        <Box p={[0, -0.18, 0]} s={[0.23, 0.38, 0.32]} color={shirt} />
        <Box p={[0, -0.47, 0]} s={[0.25, 0.23, 0.29]} color={skin} />
      </group>
      <group ref={right} position={[0.43, 1.04, 0]}>
        <Box p={[0, -0.18, 0]} s={[0.23, 0.38, 0.32]} color={shirt} />
        <Box p={[0, -0.47, 0]} s={[0.25, 0.23, 0.29]} color={skin} />
      </group>
      <Box p={[0, 1.37, 0]} s={[0.7, 0.66, 0.6]} color={skin} />
      <Box p={[0, 1.7, 0]} s={[0.76, 0.16, 0.66]} color={hair} />
      <Box p={[0, 1.47, -0.28]} s={[0.76, 0.43, 0.12]} color={hair} />
      <Box p={[-0.28, 1.58, 0.29]} s={[0.22, 0.22, 0.06]} color={hair} />
      <Box p={[0.13, 1.64, 0.29]} s={[0.39, 0.12, 0.06]} color={hair} />
      {profile.hairstyle === "bob" &&
        [-0.34, 0.34].map((x) => (
          <Box key={x} p={[x, 1.38, 0]} s={[0.15, 0.58, 0.64]} color={hair} />
        ))}
      {profile.hairstyle === "spiky" &&
        [-0.24, 0, 0.24].map((x, i) => (
          <Box
            key={x}
            p={[x, 1.86 + (i % 2) * 0.07, 0]}
            s={[0.18, 0.2, 0.4]}
            color={hair}
          />
        ))}
      {profile.hairstyle === "long" && (
        <group>
          <Box p={[0, 1.1, -0.29]} s={[0.76, 0.94, 0.18]} color={hair} />
          {[-0.35, 0.35].map((x) => (
            <Box key={x} p={[x, 1.15, 0]} s={[0.15, 0.94, 0.64]} color={hair} />
          ))}
        </group>
      )}
      {[-0.15, 0.15].map((x) => (
        <group key={x}>
          <Box p={[x, 1.39, 0.306]} s={[0.075, 0.1, 0.025]} color="#333342" />
          <Box
            p={[x - 0.009, 1.41, 0.323]}
            s={[0.023, 0.03, 0.008]}
            color="#fff9e9"
          />
          <Box
            p={[x * 1.4, 1.27, 0.31]}
            s={[0.1, 0.04, 0.01]}
            color="#d88b7c"
          />
        </group>
      ))}
      <Box p={[0, 1.23, 0.312]} s={[0.1, 0.035, 0.02]} color="#9c6658" />
      {profile.accessory === "cap" && (
        <group>
          <Box p={[0, 1.8, 0]} s={[0.82, 0.18, 0.72]} color="#749e82" />
          <Box p={[0, 1.73, 0.36]} s={[0.76, 0.07, 0.3]} color="#52785d" />
        </group>
      )}
      {profile.accessory === "glasses" && (
        <group>
          <Box p={[0, 1.4, 0.344]} s={[0.57, 0.04, 0.028]} color="#43384e" />
          {[-0.16, 0.16].map((x) => (
            <group key={x}>
              <Box
                p={[x, 1.33, 0.344]}
                s={[0.24, 0.025, 0.025]}
                color="#43384e"
              />
              {[-0.12, 0.12].map((o) => (
                <Box
                  key={o}
                  p={[x + o, 1.37, 0.344]}
                  s={[0.025, 0.1, 0.025]}
                  color="#43384e"
                />
              ))}
            </group>
          ))}
        </group>
      )}
    </group>
  );
}
