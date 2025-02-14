import { MutableRefObject, PropsWithChildren, useRef } from "react";
import useListings, { ListingWithMetadata } from "../hooks/useListings";
import Frame from "./Frame";
import { DoubleSide, Group, Object3DEventMap } from "three";
import { useUpProvider } from "../context/UpProvider";
import useBuyFunction from "../hooks/useBuyFunction";
import MarbleDiffuseTexture from "./assets/marble/diffuse.jpg";
import { useTexture } from "@react-three/drei";

function Frames({
  onUnlock,
}: PropsWithChildren<{
  onUnlock: () => void;
}>) {
  const upContext = useUpProvider();
  const ref = useRef() as MutableRefObject<Group<Object3DEventMap>>;
  const buy = useBuyFunction();
  const { listingsCount, listings, removeListingWithId } = useListings(
    upContext.contextAccounts[0]
  );

  const onBuy = async (listing: ListingWithMetadata) => {
    if (!upContext.isConnectedToVisitorAccount) return false;
    onUnlock();
    const success = await buy(listing);
    if (success) {
      removeListingWithId(listing.listingId);
    }
    return success;
  };

  const diffuseMap = useTexture(MarbleDiffuseTexture);

  return (
    <group position={[0, 0, 0]} ref={ref}>
      {listings.map((listing, index) => (
        <Frame
          key={listing.listingId}
          count={listingsCount}
          index={index}
          enabled={upContext.isImmersed}
          listing={listing}
          onBuy={onBuy}
          isSeller={upContext.isConnectedToContextAccount}
          isBuyer={upContext.isConnectedToVisitorAccount}
        />
      ))}
      <mesh
        scale={[
          Math.max(3, listingsCount - 1),
          10,
          Math.max(3, listingsCount - 1),
        ]}
        position={[0, 0, 0]}
        raycast={() => null}
      >
        <cylinderGeometry />

        {/* <meshPhysicalMaterial
          fog={false}
          attach="material"
          normalMap={normalMap}
          map={diffuseMap}
          alphaMap={alphaMap}
          metalness={0.5}
          reflectivity={1}
          clearcoat={1}
          side={DoubleSide}
        /> */}
        <meshStandardMaterial
          fog={false}
          attach="material"
          map={diffuseMap}
          metalness={0.5}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default Frames;
