import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function SeatViewPreview({
  sectionName,
}: {
  sectionName: string;
}): JSX.Element {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-border bg-card"
      aria-labelledby="seat-view-title"
    >
      <div className="grid gap-1 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Accessible arrival confidence
        </p>
        <h2 className="font-display text-2xl font-bold" id="seat-view-title">
          View from {sectionName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Demo seat coordinates place the camera at row 12, seat 18. Drag to
          verify the pitch sightline before arrival.
        </p>
      </div>
      <div
        className="h-72"
        role="img"
        aria-label={`Interactive demo seat view from ${sectionName}`}
      >
        <Canvas
          camera={{ position: [0, 1.45, 4.5], fov: 52 }}
          dpr={[1, 1.25]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={2} />
          <directionalLight intensity={2.4} position={[3, 5, 4]} />
          <mesh position={[0, -0.75, -2.5]}>
            <boxGeometry args={[7, 0.15, 4]} />
            <meshStandardMaterial color="#16875c" />
          </mesh>
          <mesh position={[0, 0, -5]}>
            <boxGeometry args={[7.8, 2.4, 0.22]} />
            <meshStandardMaterial color="#164e63" />
          </mesh>
          {[-2.8, -1.4, 0, 1.4, 2.8].map((x) => (
            <mesh key={x} position={[x, -0.25, 0.8]}>
              <boxGeometry args={[0.75, 0.8, 0.65]} />
              <meshStandardMaterial color="#f2b705" />
            </mesh>
          ))}
          <OrbitControls
            enablePan={false}
            maxDistance={6}
            minDistance={3.4}
            target={[0, -0.2, -2.5]}
          />
        </Canvas>
      </div>
      <p className="border-t border-border px-5 py-3 text-xs font-semibold text-muted-foreground">
        Preview validates sightline only. Follow the generated step-free route
        for physical access.
      </p>
    </section>
  );
}
