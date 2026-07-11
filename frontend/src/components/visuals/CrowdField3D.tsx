import { Canvas } from "@react-three/fiber";

import type { CrowdZoneSummary } from "@/types/domain";

const bandColor = {
  normal: "#16a36a",
  moderate: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
} as const;

export default function CrowdField3D({
  zones,
}: {
  zones: CrowdZoneSummary[];
}): JSX.Element {
  return (
    <div
      className="h-64 overflow-hidden rounded-3xl border border-border bg-card"
      aria-hidden="true"
    >
      <Canvas camera={{ position: [0, 5.5, 7], fov: 45 }} dpr={[1, 1.4]}>
        <ambientLight intensity={2} />
        <directionalLight intensity={2.2} position={[3, 5, 4]} />
        <group rotation={[-0.45, 0, 0]}>
          {zones.slice(0, 12).map((zone, index) => {
            const x = (index % 4) * 1.45 - 2.2;
            const z = Math.floor(index / 4) * 1.45 - 1.1;
            const height = Math.max(0.3, zone.currentDensityPct / 28);
            return (
              <mesh key={zone.zoneId} position={[x, height / 2, z]}>
                <boxGeometry args={[1.05, height, 1.05]} />
                <meshStandardMaterial
                  color={bandColor[zone.band]}
                  roughness={0.55}
                />
              </mesh>
            );
          })}
        </group>
      </Canvas>
    </div>
  );
}
