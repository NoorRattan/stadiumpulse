import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";
import * as THREE from "three";

function SphereMesh(): JSX.Element {
  const mesh = useRef<Mesh>(null);
  const wireframe = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(1.6, 3);
    const material = new THREE.MeshBasicMaterial({
      color: "#00ff88",
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    return { geometry, material };
  }, []);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += delta * 0.12;
    mesh.current.rotation.y += delta * 0.18;
    mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
  });

  return (
    <mesh
      ref={mesh}
      geometry={wireframe.geometry}
      material={wireframe.material}
    />
  );
}

function OrbitRing({
  radius,
  color,
}: {
  radius: number;
  color: string;
}): JSX.Element {
  const ring = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ring.current) return;
    ring.current.rotation.z = state.clock.elapsedTime * 0.25;
    ring.current.rotation.x = Math.PI / 2.4;
  });
  return (
    <mesh ref={ring}>
      <torusGeometry args={[radius, 0.012, 8, 96]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} />
    </mesh>
  );
}

/** Reactive R3F wireframe sphere inspired by brutalist void portfolio templates. */
export default function WireframeSphere(): JSX.Element {
  return (
    <div aria-hidden="true" className="h-full min-h-72 w-full">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.6} />
        <pointLight color="#00d4ff" intensity={8} position={[2, 3, 4]} />
        <pointLight color="#00ff88" intensity={6} position={[-3, -1, 2]} />
        <SphereMesh />
        <OrbitRing color="#00d4ff" radius={2.1} />
        <OrbitRing color="#ff6b35" radius={2.45} />
      </Canvas>
    </div>
  );
}
