// Crypto
import { ethers } from "ethers";

// Provider
import {
  IPFS_GATEWAY,
  JSON_RPC_PROVIDER,
  LSP8_LISTINGS,
  LSP8_MARKETPLACE,
} from "../constants";

// Contract
import LSP0ERC725Account from "@lukso/lsp0-contracts/artifacts/LSP0ERC725Account.json";
import LSP8Listings from "../json//LSP8Listings.json";
import LSP8Marketplace from "../json//LSP8Marketplace.json";

export const MarketplaceContract = new ethers.Contract(
  LSP8_MARKETPLACE,
  LSP8Marketplace,
  JSON_RPC_PROVIDER
);

export const ListingsContract = new ethers.Contract(
  LSP8_LISTINGS,
  LSP8Listings,
  JSON_RPC_PROVIDER
);

export const getProfileContract = (profileContractAddress: `0x${string}`) =>
  new ethers.Contract(
    profileContractAddress,
    LSP0ERC725Account.abi,
    JSON_RPC_PROVIDER
  );

export const ipfsUrl = (url: string) => url.replace("ipfs://", IPFS_GATEWAY);
