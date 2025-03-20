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

  if (!fcl) return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 text-gray-300">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
        <p>Loading Flow SDK...</p>
      </div>
    </div>
  );

  return (
    <div className="mt-6 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 text-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.61 4.241a3.25 3.25 0 0 1 2.261 2.261l.797 3.02a1.75 1.75 0 0 1-.56 1.67l-6.5 5.5a.999.999 0 0 1-1.42-.122l-5-6a1 1 0 0 1 .053-1.313l6.5-6.417a1.75 1.75 0 0 1 1.67-.56l3.02.797Zm1.746 3.471a1.75 1.75 0 0 0-1.218-1.218l-3.02-.797a.25.25 0 0 0-.238.08l-6.5 6.416 5 6 6.5-5.5a.25.25 0 0 0 .08-.238l-.797-3.02a.25.25 0 0 0-.033-.097 2.73 2.73 0 0 1 .227-.626ZM15.5 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
        </svg>
        Your Flow NFTs
      </h2>

      {error && (
        <div className="bg-red-900 text-red-300 p-3 rounded mb-4 border border-red-800">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
          {!error.includes("don't have an NFT collection") && (
            <button
              className="mt-2 px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-800 w-full flex items-center justify-center"
              onClick={() => (hasCollection ? fetchNFTs() : checkCollection())}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="p-4 bg-gray-800 border border-gray-700 rounded">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-blue-300">Loading NFTs...</p>
          </div>
        </div>
      ) : hasCollection === false ? (
        <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded">
          <p className="mb-3 text-gray-300">You need to set up an NFT collection first.</p>
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
              <div className="truncate mb-2">
                <a
                  href={`https://testnet.flowscan.io/nft/A.d049c2e1e3ec47da.UFC_NFT.NFT/token/A.d049c2e1e3ec47da.UFC_NFT.NFT-${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm"
                  title={`View NFT #${id} on FlowScan`}
                >
                  NFT #{id}
                </a>
              </div>
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
        <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded text-center">
          <p className="text-gray-300 mb-2">You don't have any NFTs yet.</p>
          <p className="text-gray-400 text-sm">Click the button below to mint your first one!</p>
        </div>
      ) : null}

      {hasCollection && (
        <div className="flex justify-center mt-6">
          <button
            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center"
            onClick={mintNFT}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Mint New NFT
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
