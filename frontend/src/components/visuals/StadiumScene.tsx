import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";

function Stadium(): JSX.Element {
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.04;
    }
  });
  const seats = Array.from({ length: 28 }, (_, index) => {
    const angle = (index / 28) * Math.PI * 2;
    return { x: Math.cos(angle) * 2.25, z: Math.sin(angle) * 1.35, angle };
  });
  return (
    <group ref={group} rotation={[-0.18, 0, 0]}>
      <RoundedBox
        args={[3.4, 0.12, 1.65]}
        radius={0.12}
        position={[0, -0.08, 0]}
      >
        <meshStandardMaterial color="#16a36a" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[2.2, 0.04, 0.95]} radius={0.08} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ecfdf5" roughness={0.9} />
      </RoundedBox>
      {seats.map((seat, index) => (
        <mesh
          key={index}
          position={[seat.x, 0.25, seat.z]}
          rotation={[0, -seat.angle, 0]}
        >
          <boxGeometry args={[0.38, 0.48, 0.18]} />
          <meshStandardMaterial
            color={index % 3 === 0 ? "#f59e0b" : "#164e63"}
          />
        </mesh>
      ))}
      <pointLight color="#22d3ee" intensity={14} position={[0, 2, 0]} />
    </group>
  );
}

export default function StadiumScene(): JSX.Element {
  return (
    <div className="h-full min-h-72 w-full" aria-hidden="true">
      <Canvas camera={{ position: [4.6, 3.7, 5.5], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={1.8} />
        <directionalLight intensity={2.5} position={[4, 6, 3]} />
        <Float floatIntensity={0.25} rotationIntensity={0.08} speed={1.2}>
          <Stadium />
        </Float>
      </Canvas>
    </div>
  );
}
