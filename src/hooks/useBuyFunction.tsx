// React
import { useCallback } from "react";

// Provider
import { useUpProvider } from "../context/UpProvider";

// Hooks
import { ethers, TransactionReceipt } from "ethers";

// Constants
import { JSON_RPC_PROVIDER, LSP8_MARKETPLACE } from "../constants";

// ABI
import LSP8MarketplaceABI from "../json/LSP8Marketplace.json";
import { ListingWithMetadata } from "./useListings";

// Toast
import { toast } from "react-toastify";

function useBuyFunction() {
  const upContext = useUpProvider();

  return useCallback(
    async (listing: ListingWithMetadata): Promise<boolean> => {
      const buyer = upContext.accounts[0] as `0x${string}`;
      if (
        !upContext.walletConnected ||
        upContext.isConnectedToContextAccount ||
        !upContext.client
      ) {
        return false;
      }

      upContext.setIsWaitingForTx(true);

      const contract = new ethers.Contract(
        LSP8_MARKETPLACE,
        LSP8MarketplaceABI,
        upContext.client
      );

      const data: string = contract.interface.encodeFunctionData("buy", [
        listing.listingId,
        buyer,
      ]);

      const buyPromise = new Promise((resolve, reject) => {
        console.log("Starting to buy NFT...");
        upContext.client
          .sendTransaction({
            account: buyer,
            to: LSP8_MARKETPLACE,
            value: ethers.parseEther(listing.price),
            data,
          })
          .then((tx: `0x${string}`) => {
            console.log("TX:", tx);
            return JSON_RPC_PROVIDER.waitForTransaction(tx);
          })
          .then((receipt: TransactionReceipt) => {
            console.log("RECEIPT:", receipt);
            return true;
          })
          .then(resolve)
          .catch((e: unknown) => {
            console.log("Failed to buy the nft.");
            reject(e);
          });
      });

      try {
        await toast.promise(
          buyPromise,
          {
            pending: "Buying NFT...",
            success: "NFT successfully bought!",
            error: "Failed to buy the NFT!",
          },
          {
            position: "bottom-center",
          }
        );
        upContext.setIsWaitingForTx(false);
        return true;
      } catch (e) {
        console.error(e);
        upContext.setIsWaitingForTx(false);
        return false;
      }
    },
    [upContext]
  );
}

export default useBuyFunction;
