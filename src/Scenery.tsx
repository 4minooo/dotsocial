import { Box } from "./Avatar";
import { obstacles, type Obstacle } from "./model";
const desks = [
  { x: -3.5, z: -3 },
  { x: 3.5, z: -3 },
  { x: -3.5, z: 1 },
  { x: 3.5, z: 1 },
];
const tables = [
  { x: -3.8, z: -2 },
  { x: 0, z: -2 },
  { x: 3.8, z: -2 },
  { x: -3.8, z: 2 },
  { x: 3.8, z: 2 },
];
export function mapObstacles(map: string): Obstacle[] {
  if (map === "park") return obstacles;
  if (map === "office") return desks.map((p) => ({ ...p, w: 2.5, d: 2.5 }));
  if (map === "cafe")
    return [
      ...tables.map((p) => ({ ...p, w: 1.8, d: 1.8 })),
      { x: 0, z: -5.5, w: 8, d: 1.5 },
    ];
  if (map === "rooftop")
    return [
      { x: -3.7, z: -3, w: 3.3, d: 1 },
      { x: 3.8, z: 0, w: 2, d: 2 },
      ...[-5.8, 5.8].flatMap((x) =>
        [-4, 0, 4].map((z) => ({ x, z, w: 0.8, d: 0.8 })),
      ),
    ];
  return [
    { x: -4, z: -3, w: 2, d: 1.2 },
    { x: 4, z: -3, w: 2, d: 1.2 },
    { x: 3.8, z: 3, w: 1.4, d: 2 },
  ];
}
function Pot({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.25, 0]} s={[0.7, 0.5, 0.7]} color="#c79a7c" />
      <Box p={[0, 0.8, 0]} s={[0.65, 0.7, 0.65]} color="#84a576" />
      <Box p={[0.1, 1.2, 0]} s={[0.4, 0.3, 0.4]} color="#9cb98a" />
    </group>
  );
}
export default function Scenery({ map }: { map: string }) {
  const floor =
    {
      rooftop: "#c0b7ae",
      office: "#c9cbd0",
      cafe: "#dbc7a5",
      beach: "#ead8aa",
    }[map] ?? "#c8cebc";
  return (
    <group>
      <Box
        p={[0, -0.25, 0]}
        s={[14.5, 0.5, 14.5]}
        color={map === "beach" ? "#c8b992" : "#aba99f"}
      />
      <Box p={[0, 0.015, 0]} s={[14.5, 0.04, 14.5]} color={floor} />
      {map === "rooftop" && (
        <>
          {[-7, 7].map((z) => (
            <Box key={z} p={[0, 0.5, z]} s={[14, 0.9, 0.22]} color="#dcd1bd" />
          ))}
          {[-7, 7].map((x) => (
            <Box key={x} p={[x, 0.5, 0]} s={[0.22, 0.9, 14]} color="#dcd1bd" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <Box
              key={i}
              p={[-10 + i * 2.3, -2 - (i % 3), -11]}
              s={[1.8, 3 + (i % 4), 2]}
              color={i % 2 ? "#bcaeb9" : "#c9b8bb"}
            />
          ))}
          <Box p={[-3.7, 0.4, -3]} s={[3.2, 0.2, 1]} color="#c99878" />
          <Box p={[-3.7, 0.75, -3.4]} s={[3.2, 0.65, 0.15]} color="#d8ad8d" />
          <Box p={[3.8, 0.55, 0]} s={[1.8, 1.1, 1.8]} color="#a9a6a6" />
          <Box p={[3.8, 1.13, 0]} s={[1.4, 0.1, 1.4]} color="#7e8586" />
          {[-5.8, 5.8].flatMap((x) =>
            [-4, 0, 4].map((z) => <Pot key={`${x}-${z}`} x={x} z={z} />),
          )}
          {Array.from({ length: 9 }, (_, i) => (
            <Box
              key={i}
              p={[-6 + i * 1.5, 0.045, 0]}
              s={[0.025, 0.01, 14]}
              color="#b0a8a1"
            />
          ))}
        </>
      )}
      {(map === "office" || map === "cafe") && (
        <>
          <Box
            p={[0, 1.4, -7]}
            s={[14.5, 2.8, 0.2]}
            color={map === "office" ? "#dfdfdb" : "#e6d4bd"}
          />
          <Box
            p={[-7, 1.4, 0]}
            s={[0.2, 2.8, 14.5]}
            color={map === "office" ? "#d5d9d6" : "#d4c1a8"}
          />
          {[-4, 0, 4].map((x) => (
            <group key={x}>
              <Box p={[x, 1.65, -6.85]} s={[2.7, 1.7, 0.08]} color="#adced0" />
              <Box p={[x, 1.65, -6.75]} s={[0.1, 1.8, 0.05]} color="#f0eee6" />
            </group>
          ))}
        </>
      )}
      {map === "office" && (
        <>
          {desks.map((p, i) => (
            <group key={i} position={[p.x, 0, p.z]}>
              <Box p={[0, 0.8, 0]} s={[2.4, 0.16, 1.4]} color="#ddc7a1" />
              {[-0.9, 0.9].map((x) => (
                <Box
                  key={x}
                  p={[x, 0.4, 0]}
                  s={[0.13, 0.8, 1]}
                  color="#929a9b"
                />
              ))}
              <Box p={[0, 1.23, -0.3]} s={[0.9, 0.65, 0.13]} color="#525d6b" />
              <Box
                p={[0, 1.23, -0.22]}
                s={[0.74, 0.47, 0.03]}
                color="#94b9c5"
              />
              <Box p={[0, 0.92, 0.18]} s={[0.8, 0.06, 0.3]} color="#ecece1" />
              <Box p={[0, 0.5, 1]} s={[0.8, 0.16, 0.8]} color="#9f99b2" />
              <Box p={[0, 0.8, 1.4]} s={[0.8, 0.6, 0.15]} color="#9f99b2" />
            </group>
          ))}
          <Pot x={-5.9} z={5} />
          <Pot x={5.8} z={-5.5} />
        </>
      )}
      {map === "cafe" && (
        <>
          <Box p={[0, 0.6, -5.5]} s={[8, 1.2, 1.5]} color="#b38965" />
          <Box p={[0, 1.25, -5.5]} s={[8.2, 0.12, 1.7]} color="#f1e6ce" />
          <Box p={[-2.5, 1.7, -5.5]} s={[1, 0.8, 0.7]} color="#65706e" />
          {tables.map((p, i) => (
            <group key={i} position={[p.x, 0, p.z]}>
              <Box p={[0, 0.8, 0]} s={[1.6, 0.15, 1.6]} color="#aa7d55" />
              <Box p={[0, 0.4, 0]} s={[0.2, 0.8, 0.2]} color="#716e61" />
              {[-1, 1].map((x) => (
                <group key={x}>
                  <Box p={[x, 0.45, 0]} s={[0.6, 0.15, 0.7]} color="#bcc098" />
                  <Box p={[x, 0.2, 0]} s={[0.2, 0.4, 0.2]} color="#8c846d" />
                </group>
              ))}
              <Box p={[0, 0.98, 0]} s={[0.15, 0.22, 0.15]} color="#f5ebd6" />
            </group>
          ))}
          <Pot x={-5.8} z={5.4} />
          <Pot x={5.8} z={5.4} />
        </>
      )}
      {map === "beach" && (
        <>
          <Box p={[0, -0.04, -11]} s={[32, 0.12, 8]} color="#8dc7cc" />
          {Array.from({ length: 7 }, (_, i) => (
            <Box
              key={i}
              p={[-10 + i * 3, -0.01, -8.2]}
              s={[1.4, 0.03, 0.1]}
              color="#d9efdf"
            />
          ))}
          {[-4, 4].map((x) => (
            <group key={x} position={[x, 0, -3]}>
              <Box p={[0, 0.7, 0]} s={[0.09, 1.4, 0.09]} color="#bc9265" />
              <Box
                p={[0, 1.5, 0]}
                s={[2.4, 0.12, 2.4]}
                color={x < 0 ? "#e7aa91" : "#a9b6d0"}
              />
              <Box p={[0, 1.6, 0]} s={[1.6, 0.13, 1.6]} color="#f3e6cb" />
              <Box
                p={[0, 0.08, 0]}
                s={[2, 0.05, 1.2]}
                color={x < 0 ? "#daa1a0" : "#a6b9c5"}
              />
            </group>
          ))}
          <Box p={[3.8, 0.25, 3]} s={[1.4, 0.5, 2]} color="#c6a878" />
          {Array.from({ length: 15 }, (_, i) => (
            <Box
              key={i}
              p={[Math.sin(i * 16) * 6, 0.06, Math.cos(i * 7) * 6]}
              s={[0.12, 0.06, 0.15]}
              color={i % 2 ? "#eee9d6" : "#d9bf9c"}
            />
          ))}
          <Pot x={-6} z={3.5} />
        </>
      )}
    </group>
  );
}
