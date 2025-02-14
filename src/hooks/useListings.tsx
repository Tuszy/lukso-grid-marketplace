// React
import { useCallback, useEffect, useState } from "react";

// DB
import Dexie, { type EntityTable } from "dexie";

// Constants
import { IPFS_GATEWAY, RPC_ENDPOINT } from "../constants";

// Crypto
import { ethers } from "ethers";
import ERC725 from "@erc725/erc725.js";
import { ipfsUrl, ListingsContract } from "../utils/contractUtils";

// Schemas
import LSP4DigitalAsset from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import LSP8IdentifiableDigitalAsset from "@erc725/erc725.js/schemas/LSP8IdentifiableDigitalAsset.json";

const digitalAssetSchema = [
  ...LSP4DigitalAsset,
  ...LSP8IdentifiableDigitalAsset,
];

type Listing = {
  listingId: number;
  collection: `0x${string}`;
  tokenId: `0x${string}`;
  price: string;
};

type Collection = {
  id: number;
  address: `0x${string}`;
  name: string;
  baseUri: string;
  idFormat: number;
};

type Image = {
  width: number;
  height: number;
  url: string;
};

type Metadata = {
  id: number;
  url: string;
  name: string;
  img: Blob;
  images: Image[];
};

export type ListingWithMetadata = Omit<Listing & Metadata, "id">;

const db = new Dexie("lukso-grid-gallery-db") as Dexie & {
  inActiveListings: EntityTable<{ id: number; listingId: number }, "id">;
  collections: EntityTable<Collection, "id">;
  collectionMetadata: EntityTable<Metadata, "id">;
};
db.version(1).stores({
  inActiveListings: "++id, listingId",
  collections: "++id, address, name, baseUri, idFormat",
  collectionMetadata: "++id, url, name",
});

const getListingFilter = (owner: `0x${string}`) => {
  return ListingsContract.filters.Listed(
    null, // indexed id
    null, // indexed asset
    null, // seller
    owner, // indexed owner
    null, // tokenId
    null, // price
    null, // startTime
    null // endTime
  );
};

const getEvents = async (owner: `0x${string}`) => {
  const listingFilter = getListingFilter(owner);
  try {
    return (await ListingsContract.queryFilter(listingFilter)) as {
      args: unknown[];
    }[];
  } catch (e) {
    console.error("getEvents - queryFilter", owner, e);
    return [];
  }
};

const getListings = async (
  events: {
    args: unknown[];
  }[]
) => {
  let inactiveListingIds = new Set();

  try {
    inactiveListingIds = new Set(
      (await db.inActiveListings.toArray()).map((v) => v.listingId)
    );
  } catch (e) {
    console.error("getListings - inactiveListingIds", e);
  }

  const listings: Record<`0x${string}`, Listing> = {};
  for (const event of events) {
    const listingId = event.args[0] as number;
    if (inactiveListingIds.has(listingId)) continue;
    const collection = event.args[1] as `0x${string}`;
    const tokenId = event.args[4] as `0x${string}`;
    const price = ethers.formatEther(event.args[5] as number);
    if (!listings[tokenId] || listings[tokenId].listingId < listingId) {
      listings[tokenId] = { listingId, collection, tokenId, price };
    }
  }

  try {
    await deleteInactiveListings(listings);
    return listings;
  } catch (e) {
    console.error("getListings - deleteInactiveListings", e);
    return {};
  }
};

const deleteInactiveListings = (listings: Record<`0x${string}`, Listing>) => {
  const tokenIds = Object.keys(listings) as `0x${string}`[];

  return Promise.all(
    tokenIds.map((tokenId) =>
      ListingsContract.isActiveListing(listings[tokenId].listingId).then(
        (active) => {
          if (!active) {
            db.inActiveListings.add({
              listingId: listings[tokenId].listingId,
            });
            delete listings[tokenId];
          }
        }
      )
    )
  );
};

const getCollectionAddress = (listings: Record<`0x${string}`, Listing>) => {
  return Object.values(listings).reduce((set, current) => {
    set.add(current.collection);
    return set;
  }, new Set<`0x${string}`>());
};

const getCollections = async (collectionAddresses: Set<`0x${string}`>) => {
  const collections: Record<`0x${string}`, Omit<Collection, "id">> = {};
  for (const collectionAddress of collectionAddresses) {
    const cachedCollection = await db.collections.get({
      address: collectionAddress,
    });
    if (cachedCollection) {
      collections[collectionAddress] = cachedCollection;
      continue;
    }

    const lsp4Metadata = new ERC725(
      digitalAssetSchema,
      collectionAddress,
      RPC_ENDPOINT,
      {
        ipfsGateway: IPFS_GATEWAY,
      }
    );
    try {
      const data = await lsp4Metadata.getData([
        "LSP4TokenName",
        "LSP8TokenMetadataBaseURI",
        "LSP8TokenIdFormat",
      ]);

      const newCollection = {
        address: collectionAddress,
        name: data[0].value as string,
        baseUri: ipfsUrl(data[1].value!.url! as string),
        idFormat: data[2].value as number,
      };
      collections[collectionAddress] = newCollection;
      db.collections.add(newCollection);
    } catch (e) {
      console.error("getCollections", collectionAddress, e);
    }
  }

  return collections;
};

const getTokenMetadataUrl = (
  collectionData: Omit<Collection, "id">,
  tokenId: `0x${string}`
) =>
  collectionData.baseUri +
  (collectionData.idFormat === 0 ? parseInt(tokenId) : tokenId.substring(2));

const getListingsWithMetadata = async (
  listings: Record<`0x${string}`, Listing>,
  collections: Record<`0x${string}`, Omit<Collection, "id">>,
  setListings: (listingsWithMetadata: ListingWithMetadata[]) => void,
  incrementFailedListings: () => void,
  incrementSuccessfulListings: () => void
) => {
  const listingWithMetadata = [] as ListingWithMetadata[];
  for (const listing of Object.values(listings)) {
    if (!collections[listing.collection]) continue;
    const url = getTokenMetadataUrl(
      collections[listing.collection],
      listing.tokenId
    );
    const cachedMetadata = await db.collectionMetadata.get({
      url,
    });
    if (cachedMetadata) {
      listingWithMetadata.push({ ...cachedMetadata, ...listing });
      setListings([...listingWithMetadata]);
      incrementSuccessfulListings();
      continue;
    }

    try {
      const fetchedMetadata = (await (await fetch(url)).json()).LSP4Metadata;
      const images = fetchedMetadata.images
        .flatMap((i: unknown) => i)
        .map((img: { width: number; height: number; url: string }) => ({
          width: img.width,
          height: img.height,
          url: ipfsUrl(img.url),
        })) as Image[];
      images.sort((a, b) => a.width - b.width);

      const imgResponse = await fetch(images[0].url);
      const img = await imgResponse.blob();
      const newMetadata = {
        url,
        name: fetchedMetadata.name as string,
        images,
        img,
      };

      db.collectionMetadata.add(newMetadata);
      listingWithMetadata.push({ ...newMetadata, ...listing });
      setListings([...listingWithMetadata]);
      incrementSuccessfulListings();
    } catch (e) {
      console.error("getListingsWithMetadata", listing, e);
      incrementFailedListings();
    }
  }

  return listingWithMetadata;
};

const useListings = (contextAccount: `0x${string}`) => {
  const [listings, setListings] = useState<ListingWithMetadata[]>([]);
  const [listingsCount, setListingsCount] = useState<number>(0);
  const [successfulListingsCount, setSuccessfulListingsCount] =
    useState<number>(0);
  const [failedListingsCount, setFailedListingsCount] = useState<number>(0);

  const removeListingWithId = useCallback(
    (listingId: number) =>
      setListings((listings) =>
        listings.filter((l) => l.listingId !== listingId)
      ),
    []
  );

  const incrementFailedListings = useCallback(
    () => setFailedListingsCount((failedListings) => failedListings + 1),
    []
  );

  const incrementSuccessfulListings = useCallback(
    () =>
      setSuccessfulListingsCount(
        (successfulListings) => successfulListings + 1
      ),
    []
  );

  useEffect(() => {
    const fetchListings = async () => {
      if (!contextAccount) return;
      console.time("FETCH LISTINGS");

      const events = await getEvents(contextAccount);
      const listings = await getListings(events);

      setListingsCount(Object.keys(listings).length);

      const collectionAddresses = getCollectionAddress(listings);

      const collections = await getCollections(collectionAddresses);

      await getListingsWithMetadata(
        listings,
        collections,
        setListings,
        incrementFailedListings,
        incrementSuccessfulListings
      );

      console.timeEnd("FETCH LISTINGS");
    };

    fetchListings();
  }, [contextAccount, incrementFailedListings, incrementSuccessfulListings]);

  return {
    successfulListingsCount,
    failedListingsCount,
    listingsCount,
    listings,
    removeListingWithId,
  };
};

export default useListings;
