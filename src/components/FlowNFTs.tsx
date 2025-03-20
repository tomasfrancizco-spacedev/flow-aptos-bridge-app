"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FlowNFTsProps {
  userAddress?: string;
}

export const FlowNFTs = ({ userAddress }: FlowNFTsProps) => {
  const router = useRouter();
  const [fcl, setFcl] = useState<any>(null);
  const [nfts, setNfts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [hasCollection, setHasCollection] = useState<boolean | null>(null);

  useEffect(() => {
    // Import FCL only on client-side
    const loadFcl = async () => {
      const fclModule = await import("@onflow/fcl");
      setFcl(fclModule);
    };

    loadFcl();
  }, []);

  useEffect(() => {
    if (fcl && userAddress) {
      // Check if user has a collection
      checkCollection();
    }
  }, [fcl, userAddress]);

  const checkCollection = async () => {
    if (!fcl || !userAddress) return;

    setLoading(true);
    setError(null);

    try {
      const getNFTsScript = await fetch("/api/cadence/get-nfts-script").then(
        (r) => r.text()
      );

      await fcl.query({
        cadence: getNFTsScript,
        args: (arg: any, t: any) => [arg(userAddress, t.Address)],
      });

      // If we get here, collection exists
      setHasCollection(true);
      fetchNFTs();
    } catch (err: any) {
      console.error("Error checking collection:", err);
      // If the error contains specific text about capability, collection doesn't exist
      if (err.message && err.message.includes("Could not borrow capability")) {
        setHasCollection(false);
        setError("You don't have an NFT collection set up yet.");
      } else {
        setError(
          `Error checking collection: ${err.message || "Unknown error"}`
        );
      }
      setLoading(false);
    }
  };

  const fetchNFTs = async () => {
    if (!fcl || !userAddress) return;

    setLoading(true);
    setError(null);

    try {
      const getNFTsScript = await fetch("/api/cadence/get-nfts-script").then(
        (r) => r.text()
      );

      const result = await fcl.query({
        cadence: getNFTsScript,
        args: (arg: any, t: any) => [arg(userAddress, t.Address)],
      });

      setNfts(Array.isArray(result) ? result.map(String) : []);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching NFTs:", err);
      setError(`Error fetching NFTs: ${err.message || "Unknown error"}`);
      setLoading(false);
    }
  };

  const setupCollection = async () => {
    if (!fcl || !userAddress) return;

    setLoading(true);
    setError(null);

    try {
      const setupCollectionTx = await fetch(
        "/api/cadence/setup-collection-tx"
      ).then((r) => r.text());

      console.log("Transaction code:", setupCollectionTx);

      const txId = await fcl.mutate({
        cadence: setupCollectionTx,
        args: (arg: any, t: any) => [],
        limit: 999,
      });

      console.log("Setting up collection with transaction ID:", txId);

      const txStatus = await fcl.tx(txId).onceSealed();
      console.log("Transaction sealed:", txStatus);

      setHasCollection(true);
      fetchNFTs();
    } catch (err: any) {
      console.error("Error setting up collection:", err);
      // Log more detailed error info
      if (err.message) console.error("Error message:", err.message);
      if (err.stack) console.error("Error stack:", err.stack);
      if (err.errorMessage) console.error("Error details:", err.errorMessage);
      if (err.transactionId)
        console.error("Transaction ID:", err.transactionId);

      setError(
        `Error setting up collection: ${err.message || "Unknown error"}`
      );
      setLoading(false);
    }
  };

  const mintNFT = async () => {
    if (!fcl || !userAddress) return;

    setLoading(true);
    setError(null);

    try {
      const mintNftTx = await fetch("/api/cadence/mint-nft-tx").then((r) =>
        r.text()
      );

      console.log("Mint NFT transaction code:", mintNftTx);
      console.log("Using user address:", userAddress);

      // Use existing series and set IDs
      const seriesId = 1; // "UFC Series #1"
      const setId = 1; // "UFC Fight Moments"
      const tokenId = Date.now(); // Use current timestamp as a unique token ID

      console.log(
        `Minting with seriesId: ${seriesId}, setId: ${setId}, tokenId: ${tokenId}`
      );

      const txId = await fcl.mutate({
        cadence: mintNftTx,
        args: (arg: any, t: any) => [
          arg(userAddress, t.Address),
          arg(tokenId.toString(), t.UInt64),
          arg(seriesId.toString(), t.UInt32),
          arg(setId.toString(), t.UInt32),
        ],
        limit: 999,
      });

      console.log("Minting NFT with transaction ID:", txId);

      const txStatus = await fcl.tx(txId).onceSealed();
      console.log("Transaction sealed:", txStatus);

      // Refresh NFTs list
      fetchNFTs();
    } catch (err: any) {
      console.error("Error minting NFT:", err);
      // Log more detailed error info
      if (err.message) console.error("Error message:", err.message);
      if (err.stack) console.error("Error stack:", err.stack);
      if (err.errorMessage) console.error("Error details:", err.errorMessage);
      if (err.transactionId)
        console.error("Transaction ID:", err.transactionId);

      let errorMsg = `Error minting NFT: ${err.message || "Unknown error"}`;

      // Check for common error patterns
      if (err.message && err.message.includes("restricted types")) {
        errorMsg =
          "Error with type syntax in the transaction. Please contact the developer.";
      } else if (
        err.message &&
        err.message.includes("Could not borrow a reference to the NFT minter")
      ) {
        errorMsg = "This account doesn't have permission to mint NFTs.";
      } else if (
        err.message &&
        err.message.includes("Could not borrow admin reference")
      ) {
        errorMsg =
          "Admin access required to mint NFTs. Please make sure you're using the admin account.";
      } else if (err.message && err.message.includes("Could not find series")) {
        errorMsg = "Series ID not found. The specified series may not exist.";
      } else if (err.message && err.message.includes("Could not find set")) {
        errorMsg = "Set ID not found. The specified set may not exist.";
      } else if (err.message && err.message.includes("publicMintNFT")) {
        errorMsg =
          "Error with public minting function. The contract may not support public minting.";
      }

      setError(errorMsg);
      setLoading(false);
    }
  };

  const selectNFT = (id: string) => {
    setSelectedNftId(id);
    // Store the selected NFT ID in localStorage
    localStorage.setItem("selectedNftId", id);
    // Optionally navigate to the next step
    router.push("/aptos-connect");
  };

  if (!fcl) return <div>Loading Flow SDK...</div>;

  return (
    <div className="mt-6 text-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-white">Your Flow NFTs</h2>

      {error && (
        <div className="bg-red-900 text-red-300 p-3 rounded mb-4 border border-red-800">
          <p>{error}</p>
          {!error.includes("don't have an NFT collection") && (
            <button
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              onClick={() => (hasCollection ? fetchNFTs() : checkCollection())}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-blue-300">Loading NFTs...</div>
      ) : hasCollection === false ? (
        <div className="mb-4">
          <p className="mb-2 text-gray-300">You need to set up an NFT collection first.</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={setupCollection}
            disabled={loading}
          >
            {loading ? "Setting up..." : "Set Up Collection"}
          </button>
        </div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {nfts.map((id) => (
            <div
              key={id}
              className={`border rounded cursor-pointer p-4 ${
                selectedNftId === id ? "border-blue-500 bg-blue-900" : "border-gray-700 bg-gray-700"
              }`}
            >
              <a
                href={`https://testnet.flowscan.io/nft/A.d049c2e1e3ec47da.UFC_NFT.NFT/token/A.d049c2e1e3ec47da.UFC_NFT.NFT-${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                NFT #{id}
              </a>
              <button
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  selectNFT(id);
                }}
              >
                Select for Bridge
              </button>
            </div>
          ))}
        </div>
      ) : hasCollection ? (
        <div className="mb-4 text-gray-300">
          <p>You don't have any NFTs yet.</p>
        </div>
      ) : null}

      {hasCollection && (
        <button
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={mintNFT}
          disabled={loading}
        >
          {loading ? "Processing..." : "Mint New NFT"}
        </button>
      )}
    </div>
  );
};
