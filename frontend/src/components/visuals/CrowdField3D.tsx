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
  selectedZoneId,
  onSelectZone,
}: {
  zones: CrowdZoneSummary[];
  selectedZoneId?: string;
  onSelectZone?: (zone: CrowdZoneSummary) => void;
}): JSX.Element {
  return (
    <div
      className="relative h-72 overflow-hidden rounded-3xl border border-border bg-card"
      role="img"
      aria-label="Interactive stadium digital twin colored by live zone density"
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
              <mesh
                key={zone.zoneId}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectZone?.(zone);
                }}
                position={[x, height / 2, z]}
                scale={selectedZoneId === zone.zoneId ? 1.12 : 1}
              >
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
      <div className="absolute inset-x-3 bottom-3 flex gap-2 overflow-x-auto rounded-2xl bg-background/90 p-2 backdrop-blur">
        {zones.map((zone) => (
          <button
            aria-pressed={selectedZoneId === zone.zoneId}
            className="min-h-9 shrink-0 rounded-full border border-border px-3 text-xs font-semibold text-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            key={zone.zoneId}
            onClick={() => onSelectZone?.(zone)}
            type="button"
          >
            {zone.name} {Math.round(zone.currentDensityPct)}%
          </button>
        ))}
      </div>
    </div>
  );
}
