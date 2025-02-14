import { ethers } from "ethers";

export const IPFS_GATEWAY = "https://api.universalprofile.cloud/ipfs/";
export const RPC_ENDPOINT = "https://rpc.mainnet.lukso.network";

export const JSON_RPC_PROVIDER = new ethers.JsonRpcProvider(RPC_ENDPOINT);

export const LSP8_MARKETPLACE: `0x${string}` =
  "0x6807c995602eaf523a95a6b97acc4da0d3894655";

export const LSP8_LISTINGS: `0x${string}` =
  "0x4faab47b234c7f5da411429ee86cb15cb0754354";
