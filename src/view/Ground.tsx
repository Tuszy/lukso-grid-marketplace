import { MeshReflectorMaterial } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";

export function Ground() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh position={[0, 0, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[10000, 10000]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={80}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
          mirror={0}
        />
      </mesh>
      <CuboidCollider args={[10000, 2, 10000]} position={[0, -2, 0]} />
    </RigidBody>
  );
}
