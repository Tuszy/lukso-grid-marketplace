import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d-compat";
import { MutableRefObject, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { CapsuleCollider, RigidBody, useRapier } from "@react-three/rapier";
import { QueryFilterFlags } from "@dimforge/rapier3d-compat";

const SPEED = 5;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();

export function Player({ enabled }: { enabled: boolean }) {
  const ref = useRef() as MutableRefObject<RAPIER.RigidBody>;
  const rapier = useRapier();
  const [, get] = useKeyboardControls();
  useFrame((state) => {
    if (!ref.current) return;
    const { forward, backward, left, right, jump } = get();
    const velocity = ref.current.linvel();
    // update camera
    const newPos = ref.current.translation();
    state.camera.position.set(newPos.x, newPos.y, newPos.z);
    // movement
    if (enabled) {
      frontVector.set(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0));
      sideVector.set((left ? 1 : 0) - (right ? 1 : 0), 0, 0);
      direction
        .subVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(SPEED)
        .applyEuler(state.camera.rotation);
      ref.current.setLinvel(
        { x: direction.x, y: velocity.y, z: direction.z },
        true
      );
      // jumping
      const ray = rapier.world.castRay(
        new RAPIER.Ray(ref.current.translation(), { x: 0, y: -1, z: 0 }),
        10,
        true,
        QueryFilterFlags.EXCLUDE_DYNAMIC
      );
      const grounded =
        ray && ray.collider && Math.abs(ray.timeOfImpact) <= 1.25;
      if (jump && grounded) ref.current.setLinvel({ x: 0, y: 8.5, z: 0 }, true);
    }
  });
  return (
    <>
      <RigidBody
        ref={ref}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 4, 0]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[0.75, 0.5]} friction={0} />
      </RigidBody>
    </>
  );
}
