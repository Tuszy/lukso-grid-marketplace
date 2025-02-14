// React
import { RefAttributes, useMemo, useRef } from "react";
import * as React from "react";

// Provider
import { useUpProvider } from "../context/UpProvider";

// 3D
import { Canvas } from "@react-three/fiber";
import {
  PointerLockControls,
  KeyboardControlsEntry,
  KeyboardControls,
  PointerLockControlsProps,
  Environment,
} from "@react-three/drei";
import Frames from "./Frames";
import { Physics } from "@react-three/rapier";
import { Player } from "./Player";
import { Ground } from "./Ground";

enum Controls {
  forward = "forward",
  backward = "backward",
  left = "left",
  right = "right",
  jump = "jump",
}

function Main() {
  const pointerLockRef = useRef() as React.MutableRefObject<
    // @ts-expect-error ref type
    IntrinsicAttributes &
      Omit<PointerLockControlsProps, "ref"> &
      RefAttributes<typeof PointerLockControls>
  >;
  const upContext = useUpProvider();

  const map = useMemo<KeyboardControlsEntry<Controls>[]>(
    () => [
      { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
      { name: Controls.backward, keys: ["ArrowDown", "KeyS"] },
      { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
      { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
      { name: Controls.jump, keys: ["Space"] },
    ],
    []
  );

  return (
    <div className="h-screen w-screen">
      <KeyboardControls map={map}>
        <Canvas dpr={[1, 1.5]}>
          <color attach="background" args={["#191920"]} />
          <fog attach="fog" args={["#191920", 0, 15]} />
          <Physics gravity={[0, -30, 0]}>
            <Ground />
            <Frames onUnlock={() => pointerLockRef.current?.unlock()} />
            <Player enabled={upContext.isImmersed} />
          </Physics>
          <PointerLockControls
            ref={pointerLockRef}
            onLock={() => upContext.setIsImmersed(true)}
            onUnlock={() => upContext.setIsImmersed(false)}
          />
          <ambientLight intensity={1.5} />
          <Environment preset="city" />
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

export default Main;
