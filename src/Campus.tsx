import { Box } from "./Avatar";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

function CherryTree({ x, z, index }: { x: number; z: number; index: number }) {
  const crown = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (crown.current)
      crown.current.rotation.z =
        Math.sin(clock.elapsedTime * 0.7 + index) * 0.018;
  });
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.08, 0]} s={[1.7, 0.16, 1.7]} color="#eee5db" />
      <Box p={[0, 0.85, 0]} s={[0.22, 1.7, 0.22]} color="#7f6559" />
      <Box
        p={[0.25, 1.5, 0]}
        s={[0.16, 0.7, 0.16]}
        color="#7f6559"
        rotation={[0, 0, -0.5]}
      />
      <group ref={crown} position={[0, 2, 0]}>
        <Box s={[1.9, 0.8, 1.7]} color={index % 2 ? "#ecc7d6" : "#f5dae4"} />
        <Box p={[-0.35, 0.5, 0]} s={[1.3, 0.6, 1.4]} color="#fae6ec" />
        <Box p={[0.65, -0.25, 0.2]} s={[0.8, 0.7, 0.95]} color="#eabccc" />
        {[-0.6, 0, 0.6].map((dx, i) => (
          <Box
            key={i}
            p={[dx, 0.13, 0.89]}
            s={[0.12, 0.12, 0.08]}
            color="#fff1f3"
          />
        ))}
      </group>
    </group>
  );
}
// A voxel interpretation of the university's official Baekgyeong Plaza photos.
export default function Campus() {
  return (
    <group>
      <Box p={[0, -0.25, 0]} s={[14.5, 0.5, 14.5]} color="#c2b6aa" />
      <Box p={[0, 0.02, 0]} s={[14.5, 0.04, 14.5]} color="#e6e2d9" />
      <Box p={[0, 0.047, 0]} s={[3.5, 0.015, 14.4]} color="#c8c7c5" />
      <Box p={[0, 0.058, 0]} s={[0.08, 0.015, 14.4]} color="#f3e7c7" />
      {[-4.7, 4.7].map((x) => (
        <Box key={x} p={[x, 0.055, 0]} s={[2.5, 0.05, 13.8]} color="#b6c8a4" />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <Box
          key={i}
          p={[0, 0.065, -6.6 + i * 1.2]}
          s={[3.5, 0.01, 0.028]}
          color="#aeb2b1"
        />
      ))}
      {[-4.7, 4.7].flatMap((x, j) =>
        [-5, 0, 5].map((z, i) => (
          <CherryTree key={`${x}/${z}`} x={x} z={z} index={i + j} />
        )),
      )}
      {[-4, 0, 4].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <Box p={[-1.95, 1.5, 0]} s={[0.12, 3, 0.12]} color="#394b52" />
          <Box p={[1.95, 1.5, 0]} s={[0.12, 3, 0.12]} color="#394b52" />
          <Box p={[0, 3, 0]} s={[4.1, 0.13, 0.13]} color="#394b52" />
          <Box
            p={[1.7, 2.75, 0]}
            s={[0.1, 0.72, 0.1]}
            color="#394b52"
            rotation={[0, 0, 0.7]}
          />
        </group>
      ))}
      <group position={[0, 0, -8.2]}>
        <Box p={[0, 1.7, 0]} s={[10, 3.4, 1.3]} color="#e8e8e1" />
        <Box p={[0.6, 1.65, 0.7]} s={[4.2, 3, 0.08]} color="#a7c8d3" />
        {[-3.8, -2.3, 0, 1.4, 2.8, 4.1].flatMap((x) =>
          [1, 2.3].map((y) => (
            <Box
              key={`${x}/${y}`}
              p={[x, y, 0.73]}
              s={[0.8, 0.68, 0.06]}
              color="#8eadbe"
            />
          )),
        )}
        <Box p={[0, 3.55, 0]} s={[10.2, 0.18, 1.5]} color="#c5cfd0" />
      </group>
      {[-5, 5].map((x) => (
        <group key={x} position={[x, 0, 2.5]}>
          <Box p={[0, 0.54, 0]} s={[1.8, 0.14, 0.7]} color="#bba58a" />
          <Box p={[0, 0.9, -0.3]} s={[1.8, 0.5, 0.12]} color="#c9b497" />
          {[-0.65, 0.65].map((dx) => (
            <Box
              key={dx}
              p={[dx, 0.26, 0]}
              s={[0.12, 0.52, 0.6]}
              color="#5d6f74"
            />
          ))}
        </group>
      ))}
      <group position={[5.8, 0, -3]}>
        <Box p={[0, 0.95, 0]} s={[0.1, 1.9, 0.1]} color="#4a6570" />
        <Box p={[0, 1.75, 0]} s={[1.25, 0.7, 0.12]} color="#d8e6e2" />
        <Box p={[0, 1.85, 0.07]} s={[0.7, 0.06, 0.02]} color="#4a6570" />
        <Box p={[0, 1.65, 0.07]} s={[0.48, 0.06, 0.02]} color="#4a6570" />
      </group>
    </group>
  );
}
