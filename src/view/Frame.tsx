import * as THREE from "three";
import {
  MutableRefObject,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor, Image, Text, useTexture } from "@react-three/drei";
import { easing } from "maath";
import { ListingWithMetadata } from "../hooks/useListings";

import MarbleDiffuseTexture from "./assets/marble/diffuse.jpg";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import {
  BufferGeometry,
  Material,
  Mesh,
  NormalBufferAttributes,
  Object3DEventMap,
} from "three";

const getPositionAndRotation = (
  index: number,
  count: number,
  yPosition: number
) => {
  return {
    position: new THREE.Vector3(
      (count / 2) * Math.cos(2 * Math.PI * (index / count)),
      yPosition,
      -(count / 2) * Math.sin(2 * Math.PI * (index / count))
    ),
    rotation: new THREE.Euler(
      0,
      2 * Math.PI * (index / count) - Math.PI / 2,
      0
    ),
  };
};

const posYOffset = 0.25;
const scale = 1.8;

function Frame({
  index,
  listing,
  onBuy,
  isSeller,
  isBuyer,
  enabled,
  count,
  ...props
}: PropsWithChildren<{
  index: number;
  listing: ListingWithMetadata;
  enabled: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  count: number;
  onBuy: (listing: ListingWithMetadata) => Promise<boolean>;
}>) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const boxSize = useRef() as MutableRefObject<Mesh<
    BufferGeometry<NormalBufferAttributes>,
    Material | Material[],
    Object3DEventMap
  > | null>;
  const image = useRef() as MutableRefObject<
    THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  >;
  const frame = useRef() as MutableRefObject<
    THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  >;
  const diffuseMap = useTexture(MarbleDiffuseTexture);

  const [hovered, hover] = useState(false);

  useEffect(() => {
    if (imageUrl) return;
    setImageUrl(URL.createObjectURL(listing.img));
  }, [listing.img, imageUrl]);

  useCursor(hovered);
  useFrame((state, dt) => {
    if (!image.current || !frame.current) return;
    easing.dampC(
      frame.current.material.color,
      hovered && enabled ? "#b80" : "#222",
      0.1,
      dt
    );
  });

  const ratio = listing.images[0].height / listing.images[0].width;
  const scaledRatio = scale * ratio;

  const { position, rotation } = useMemo(() => {
    return getPositionAndRotation(index, Math.max(count, 3), scaledRatio / 2);
  }, [index, count, scaledRatio]);

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={rotation}
    >
      <group {...props}>
        <mesh
          ref={boxSize}
          scale={[scale, scaledRatio, 0.2]}
          raycast={() => null}
        >
          <boxGeometry args={[1.1, 1.6, 1]} />
          {/* <meshPhysicalMaterial
            fog={false}
            attach="material"
            normalMap={normalMap}
            map={diffuseMap}
            alphaMap={alphaMap}
            metalness={0.5}
            reflectivity={1}
            clearcoat={1}
          /> */}
          <meshStandardMaterial
            fog={false}
            attach="material"
            map={diffuseMap}
            metalness={0.5}
          />
          <mesh
            name={listing.name}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onBuy(listing);
            }}
            ref={frame}
            onPointerOver={(e) => (e.stopPropagation(), hover(true))}
            onPointerOut={() => hover(false)}
            scale={[0.95, 0.95 * ratio, 0.9]}
            position={[0, posYOffset, 0.2]}
          >
            <boxGeometry />
            <meshBasicMaterial toneMapped={false} color={"#222"} fog={false} />
          </mesh>
          {imageUrl && (
            <Image
              scale={[0.88, 0.88 * ratio]}
              raycast={() => null}
              ref={image}
              position={[0, posYOffset, 0.7]}
              url={imageUrl}
            />
          )}
        </mesh>
        <Text
          maxWidth={1.75}
          anchorX="center"
          anchorY="bottom"
          position={[0, -scaledRatio / 2 + posYOffset, 0.12]}
          fontSize={0.1}
          color={"#222"}
          castShadow={false}
          receiveShadow={false}
          fontWeight={"bold"}
          overflowWrap="break-word"
          whiteSpace="overflowWrap"
        >
          {listing.name}
        </Text>
        <Text
          maxWidth={1.75}
          anchorX="center"
          anchorY="bottom"
          position={[0, -scaledRatio / 2 + posYOffset / 2, 0.12]}
          fontSize={0.1}
          color={"#222"}
          castShadow={false}
          receiveShadow={false}
          fontWeight={"bold"}
          overflowWrap="break-word"
          whiteSpace="overflowWrap"
        >
          {parseFloat(listing.price)} LYX
        </Text>
        {hovered && (
          <Text
            anchorX="center"
            anchorY="top"
            position={[
              0,
              (boxSize.current?.position.y ?? 0) +
                (boxSize.current?.scale.y ?? 0),
              0,
            ]}
            fontSize={0.2}
            color={"#222"}
            castShadow={false}
            receiveShadow={false}
            fontWeight={"bold"}
          >
            {enabled && isSeller && "YOU OWN THIS"}
            {enabled && isBuyer && "DOUBLE CLICK TO BUY"}
            {enabled && !isSeller && !isBuyer && "CONNECT TO BUY"}
          </Text>
        )}
      </group>
      <CuboidCollider
        position={[0, 0, 0]}
        args={[scale / 2, scaledRatio / 2, 0.2 / 2]}
        friction={0}
      />
    </RigidBody>
  );
}

export default Frame;
