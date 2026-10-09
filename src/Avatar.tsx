import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { palettes, type Profile } from "./model";
import { motion, type Emote } from "./emotes";
import type { ActivityKind } from "./interactions";
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
  activity,
}: {
  profile: Profile;
  walking?: boolean;
  wave?: boolean;
  emote?: Emote;
  activity?: ActivityKind;
}) {
  const left = useRef<Group>(null),
    right = useRef<Group>(null),
    legs = useRef<Group>(null),
    body = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pose = motion(t, emote ?? (wave ? "wave" : undefined));
    if (activity && !emote) {
      pose.arm =
        activity === "sit"
          ? 0.08
          : activity === "sip"
            ? 0.6
            : activity === "water"
              ? 1.2
              : 0.6;
      pose.leftArm = activity === "sit" ? -0.08 : -0.6;
      pose.jump = activity === "build" ? -0.18 : activity === "sit" ? 0.06 : 0;
    }
    if (body.current) {
      body.current.position.y = pose.jump;
      body.current.rotation.z = pose.tilt;
    }
    if (left.current)
      left.current.rotation.x =
        activity && !emote
          ? activity === "type"
            ? -1.2 + Math.sin(t * 18) * 0.12
            : activity === "read" || activity === "look"
              ? -1.1
              : 0
          : emote === "clap"
            ? -1.2
            : walking
              ? Math.sin(t * 12) * 0.55
              : 0;
    if (left.current) left.current.rotation.z = pose.leftArm;
    if (right.current) {
      right.current.rotation.x =
        activity && !emote
          ? activity === "sip"
            ? -1.8
            : activity === "type"
              ? -1.2 - Math.sin(t * 18) * 0.12
              : activity === "water"
                ? -1.0 + Math.sin(t * 4) * 0.12
                : activity === "sit"
                  ? 0
                  : -1.1
          : emote === "clap"
            ? -1.2
            : walking
              ? -Math.sin(t * 12) * 0.55
              : -0.25;
      right.current.rotation.z = pose.arm;
    }
    if (legs.current) {
      legs.current.children[0].rotation.x =
        (activity === "sit" || activity === "type") && !emote
          ? -1.4
          : walking
            ? -Math.sin(t * 12) * 0.5
            : 0;
      legs.current.children[1].rotation.x =
        (activity === "sit" || activity === "type") && !emote
          ? -1.4
          : walking
            ? Math.sin(t * 12) * 0.5
            : 0;
    }
  });
  const hair = palettes.hair[profile.hair],
    shirt = palettes.shirt[profile.shirt],
    pants = palettes.pants[profile.pants],
    skin = palettes.skin[profile.skin ?? 0],
    accent =
      palettes.accessoryColor[profile.accessoryColor ?? 0] ??
      palettes.accessoryColor[0],
    face = profile.face ?? "friendly";
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
        {activity === "sip" && (
          <group position={[0, -0.5, 0.18]}>
            <Box s={[0.22, 0.26, 0.22]} color="#fff3de" />
            <Box p={[0, 0.135, 0]} s={[0.18, 0.015, 0.18]} color="#75503c" />
            <Box p={[0.15, 0, 0]} s={[0.08, 0.16, 0.08]} color="#fff3de" />
          </group>
        )}
        {activity === "water" && (
          <group position={[0, -0.5, 0.22]}>
            <Box s={[0.3, 0.28, 0.32]} color="#78b7ad" />
            <Box
              p={[0, 0.05, 0.28]}
              s={[0.1, 0.1, 0.32]}
              color="#78b7ad"
              rotation={[-0.3, 0, 0]}
            />
          </group>
        )}
        {activity === "build" && (
          <Box p={[0, -0.6, 0.1]} s={[0.12, 0.3, 0.06]} color="#df9e65" />
        )}
      </group>
      {activity === "read" && (
        <group position={[0, 0.82, 0.46]}>
          <Box s={[0.5, 0.35, 0.09]} color="#8caab2" />
          <Box p={[0, 0, 0.06]} s={[0.44, 0.29, 0.04]} color="#fff5da" />
          <Box p={[0, 0, 0.09]} s={[0.015, 0.28, 0.01]} color="#c7baa0" />
        </group>
      )}
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
          <Box
            p={[x, 1.39, 0.306]}
            s={[
              face === "smile" ||
              face === "sleepy" ||
              (face === "wink" && x > 0)
                ? 0.12
                : 0.075,
              face === "smile" ||
              face === "sleepy" ||
              (face === "wink" && x > 0)
                ? 0.025
                : 0.1,
              0.025,
            ]}
            rotation={
              face === "bold" ? [0, 0, x > 0 ? 0.25 : -0.25] : undefined
            }
            color="#333342"
          />
          {face !== "smile" &&
            face !== "sleepy" &&
            !(face === "wink" && x > 0) && (
              <Box
                p={[x - 0.009, 1.41, 0.323]}
                s={[0.023, 0.03, 0.008]}
                color="#fff9e9"
              />
            )}
          <Box
            p={[x * 1.4, 1.27, 0.31]}
            s={[0.1, 0.04, 0.01]}
            color="#d88b7c"
          />
        </group>
      ))}
      <Box
        p={[0, 1.23, 0.312]}
        s={[
          face === "smile" ? 0.16 : face === "sleepy" ? 0.055 : 0.1,
          face === "sleepy" ? 0.075 : 0.035,
          0.02,
        ]}
        color="#9c6658"
      />
      {profile.accessory === "cap" && (
        <group>
          <Box p={[0, 1.8, 0]} s={[0.82, 0.18, 0.72]} color={accent} />
          <Box p={[0, 1.73, 0.36]} s={[0.76, 0.07, 0.3]} color={accent} />
        </group>
      )}
      {profile.accessory === "glasses" && (
        <group>
          <Box p={[0, 1.4, 0.344]} s={[0.57, 0.04, 0.028]} color={accent} />
          {[-0.16, 0.16].map((x) => (
            <group key={x}>
              <Box
                p={[x, 1.33, 0.344]}
                s={[0.24, 0.025, 0.025]}
                color={accent}
              />
              {[-0.12, 0.12].map((o) => (
                <Box
                  key={o}
                  p={[x + o, 1.37, 0.344]}
                  s={[0.025, 0.1, 0.025]}
                  color={accent}
                />
              ))}
            </group>
          ))}
        </group>
      )}
      {profile.accessory === "headphones" && (
        <group>
          <Box p={[0, 1.84, 0]} s={[0.9, 0.09, 0.13]} color={accent} />
          {[-0.42, 0.42].map((x) => (
            <Box
              key={x}
              p={[x, 1.53, 0]}
              s={[0.15, 0.45, 0.32]}
              color={accent}
            />
          ))}
        </group>
      )}
      {profile.accessory === "ribbon" && (
        <group position={[0.25, 1.78, 0.12]}>
          <Box
            p={[-0.12, 0, 0]}
            s={[0.2, 0.22, 0.14]}
            color={accent}
            rotation={[0, 0, 0.3]}
          />
          <Box
            p={[0.12, 0, 0]}
            s={[0.2, 0.22, 0.14]}
            color={accent}
            rotation={[0, 0, -0.3]}
          />
          <Box s={[0.1, 0.13, 0.18]} color="#fff1d8" />
        </group>
      )}
      {profile.accessory === "backpack" && (
        <group>
          <Box p={[0, 0.8, -0.3]} s={[0.5, 0.5, 0.26]} color={accent} />
          {[-0.22, 0.22].map((x) => (
            <Box
              key={x}
              p={[x, 0.84, 0.2]}
              s={[0.06, 0.5, 0.04]}
              color={accent}
            />
          ))}
        </group>
      )}
      {profile.accessory === "crown" && (
        <group>
          <Box p={[0, 1.81, 0]} s={[0.8, 0.13, 0.67]} color={accent} />
          {[-0.29, 0, 0.29].map((x) => (
            <Box
              key={x}
              p={[x, 1.96, 0.27]}
              s={[0.13, 0.25, 0.13]}
              color={accent}
            />
          ))}
          <Box p={[0, 1.87, 0.345]} s={[0.11, 0.11, 0.015]} color="#ed7a9a" />
        </group>
      )}
    </group>
  );
}
