import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, InstancedMesh, Object3D } from "three";
import { Box } from "./Avatar";
import { stations } from "./interactions";

export function InteractionProps({ map }: { map: string }) {
  return (
    <group>
      {stations
        .filter((s) => s.map === map)
        .map((s) => (
          <group key={s.id} position={[s.x, 0, s.z]}>
            {s.kind === "water" && (
              <>
                <Box p={[0, 0.2, 0]} s={[0.85, 0.4, 0.7]} color="#c69675" />
                {[-0.25, 0, 0.25].map((x, i) => (
                  <group key={x}>
                    <Box
                      p={[x, 0.53, 0]}
                      s={[0.04, 0.6, 0.04]}
                      color="#77a276"
                    />
                    <Box
                      p={[x, 0.82, 0]}
                      s={[0.2, 0.12, 0.2]}
                      color={["#f4c5cd", "#ebce7f", "#d3b6e3"][i]}
                    />
                  </group>
                ))}
              </>
            )}
            {s.kind === "sip" && (
              <>
                <Box p={[0, 0.7, 0]} s={[0.8, 0.12, 0.7]} color="#b78d66" />
                <Box p={[0, 0.35, 0]} s={[0.12, 0.7, 0.12]} color="#596c68" />
                <Box p={[0, 0.9, 0]} s={[0.2, 0.3, 0.2]} color="#fff3db" />
                <Box
                  p={[0.27, 0.84, 0]}
                  s={[0.24, 0.08, 0.22]}
                  color="#d59f65"
                />
              </>
            )}
            {s.kind === "look" && (
              <>
                <Box p={[0, 0.7, 0]} s={[0.1, 1.4, 0.1]} color="#5d6c73" />
                <Box
                  p={[0, 1.45, -0.1]}
                  s={[0.35, 0.35, 1.1]}
                  color="#7c9ca9"
                  rotation={[-0.25, 0, 0]}
                />
                <Box p={[0, 1.54, -0.65]} s={[0.4, 0.4, 0.1]} color="#425568" />
              </>
            )}
            {s.kind === "build" && (
              <>
                <Box p={[0, 0.045, 0]} s={[1.1, 0.08, 0.9]} color="#d9c193" />
                <Box p={[0, 0.23, 0]} s={[0.65, 0.4, 0.6]} color="#e4cfaa" />
                {[-0.3, 0.3].map((x) => (
                  <Box
                    key={x}
                    p={[x, 0.37, 0]}
                    s={[0.18, 0.5, 0.2]}
                    color="#ecdbbc"
                  />
                ))}
                <Box
                  p={[0.5, 0.17, 0.3]}
                  s={[0.2, 0.3, 0.23]}
                  color="#c97969"
                />
              </>
            )}
            {s.kind === "read" && (
              <>
                <Box p={[0, 1.0, 0]} s={[1.1, 1.4, 0.13]} color="#5e7e81" />
                {[-0.3, 0.3].map((x) => (
                  <Box
                    key={x}
                    p={[x, 1.02, 0.09]}
                    s={[0.43, 0.7, 0.03]}
                    color={x < 0 ? "#f4dce5" : "#e6eed4"}
                  />
                ))}
                <Box p={[0, 0.5, 0]} s={[0.1, 1, 0.1]} color="#5e7e81" />
              </>
            )}
          </group>
        ))}
    </group>
  );
}
function Air({ map, low }: { map: string; low: boolean }) {
  const mesh = useRef<InstancedMesh>(null),
    dummy = useRef(new Object3D());
  const count = low ? 8 : 24;
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      dummy.current.position.set(
        Math.sin(i * 37) * 6 + Math.sin(t * 0.35 + i) * 0.3,
        0.25 + ((((i * 0.63 - t * 0.12) % 2.8) + 2.8) % 2.8),
        Math.cos(i * 19) * 6,
      );
      dummy.current.rotation.set(t * 0.3 + i, t * 0.2 + i, t * 0.4 + i);
      dummy.current.scale.setScalar(map === "campus" ? 0.07 : 0.04);
      dummy.current.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.current.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <boxGeometry />
      <meshStandardMaterial
        color={map === "campus" ? "#f5ccd9" : "#f7e8b6"}
        transparent
        opacity={0.65}
      />
    </instancedMesh>
  );
}
export default function WorldDetails({
  map,
  low,
}: {
  map: string;
  low: boolean;
}) {
  const waves = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (waves.current)
      waves.current.position.z = Math.sin(clock.elapsedTime * 0.55) * 0.3;
  });
  return (
    <group>
      {(map === "park" || map === "campus") && <Air map={map} low={low} />}
      {map === "park" && (
        <>
          <Box p={[0, 0.074, -3]} s={[1.95, 0.02, 1.95]} color="#a4d4d0" />
          {[-6.5, 6.5].flatMap((x) =>
            [-6.5, 6.5].map((z) => (
              <Box
                key={`${x}/${z}`}
                p={[x, 0.08, z]}
                s={[0.8, 0.07, 0.8]}
                color="#c6d59e"
              />
            )),
          )}
        </>
      )}
      {map === "rooftop" && (
        <>
          {Array.from({ length: low ? 5 : 16 }, (_, i) => (
            <group key={i} position={[-9 + i * 1.2, -1, -10.1]}>
              {[0, 0.75, 1.5].map((y) => (
                <Box
                  key={y}
                  p={[0, y, 0]}
                  s={[0.23, 0.32, 0.03]}
                  color="#f6d28c"
                />
              ))}
            </group>
          ))}
          {[-5, -3, -1, 1, 3, 5].map((x) => (
            <group key={x}>
              <Box p={[x, 1.6, -6.8]} s={[0.15, 0.18, 0.15]} color="#ffe3aa" />
              {!low && (
                <pointLight
                  position={[x, 1.6, -6.4]}
                  intensity={0.3}
                  color="#ffbd79"
                  distance={3}
                />
              )}
            </group>
          ))}
        </>
      )}
      {map === "office" && (
        <>
          <group position={[-6.7, 1.6, 2]}>
            <Box s={[0.12, 1.2, 2.4]} color="#ecebdc" />
            {[0, 0.4, 0.8].map((y) => (
              <Box
                key={y}
                p={[0.08, y - 0.3, 0]}
                s={[0.02, 0.07, 1.7]}
                color="#92aca1"
              />
            ))}
          </group>
          <Box p={[5.8, 0.7, 4.8]} s={[1.1, 1.4, 0.7]} color="#b5c3c6" />
          {[0.35, 0.7, 1.05].map((y) => (
            <Box
              key={y}
              p={[5.8, y, 5.17]}
              s={[0.3, 0.03, 0.02]}
              color="#778d93"
            />
          ))}
        </>
      )}
      {map === "cafe" && (
        <>
          <Box p={[0, 0.06, -5.5]} s={[9, 0.07, 3]} color="#c2a88c" />
          {[-3, 0, 3].map((x) => (
            <group key={x}>
              <Box p={[x, 2.3, -5.4]} s={[0.04, 0.9, 0.04]} color="#71624e" />
              <Box p={[x, 1.88, -5.4]} s={[0.55, 0.13, 0.55]} color="#e6c994" />
              {!low && (
                <pointLight
                  position={[x, 1.7, -5.4]}
                  color="#ffe3ac"
                  intensity={0.45}
                  distance={4}
                />
              )}
            </group>
          ))}
          <Box p={[-6.8, 1.8, -3.5]} s={[0.07, 0.8, 1.3]} color="#67806d" />
        </>
      )}
      {map === "beach" && (
        <>
          <group ref={waves}>
            {[-8, -9, -10.5].map((z, i) => (
              <Box
                key={z}
                p={[0, 0.045, z]}
                s={[18, 0.025, 0.12 + i * 0.06]}
                color="#e7f2e2"
              />
            ))}
          </group>
          {[4.5, 5.8].map((x) => (
            <group key={x} position={[x, 0, 5.5]}>
              <Box p={[0, 1.1, 0]} s={[0.18, 2.2, 0.18]} color="#b69467" />
              {[-0.6, 0.6].map((dx) => (
                <Box
                  key={dx}
                  p={[dx, 2.3, 0]}
                  s={[1.4, 0.12, 0.6]}
                  color="#83a779"
                  rotation={[0, 0, dx * 0.25]}
                />
              ))}
            </group>
          ))}
        </>
      )}
    </group>
  );
}
