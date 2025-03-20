"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  networkConfig,
  aptos,
  CONTRACT_ADDRESS,
  COLLECTION_NAME,
  verifyCollection,
} from "@/lib/aptosConfig";

const REQUIRED_NETWORK = "Devnet";

// Client-side only component
const AptosWalletClient = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ address?: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mintTxStatus, setMintTxStatus] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [isCollectionVerified, setIsCollectionVerified] = useState<
    boolean | null
  >(null);
  const [checkingCollection, setCheckingCollection] = useState<boolean>(false);

  // Mark that we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!isClient) return;

    // Get the selected NFT ID from localStorage
    const storedNftId = localStorage.getItem("selectedNftId");
    if (storedNftId) {
      setSelectedNftId(storedNftId);
    } else {
      // If no NFT is selected, redirect back to Flow NFT selection
      router.push("/");
    }
  }, [router, isClient]);

  // Check network when user connects
  useEffect(() => {
    if (user.address && window.aptos) {
      checkNetwork();
      checkCollection();
      checkUserAccountExists();
    }
  }, [user.address]);

  const checkNetwork = async () => {
    try {
      if (window.aptos) {
        const networkInfo = await window.aptos.network();
        console.log("Connected to network:", networkInfo);
        
        // The TypeScript definition says networkInfo should have a name property
        // But console.log shows it might be different in practice
        // Handle both cases to be safe
        const networkName = typeof networkInfo === 'string' 
          ? networkInfo 
          : (networkInfo as any).name || 'Unknown';
        
        setCurrentNetwork(networkName);
        console.log({ networkInfo });
        
        setIsCorrectNetwork(
          networkName.toLowerCase() === REQUIRED_NETWORK.toLowerCase()
        );
      }
    } catch (err) {
      console.error("Error checking network:", err);
      setIsCorrectNetwork(false);
    }
  };

  const checkCollection = async () => {
    setCheckingCollection(true);
    try {
      const exists = await verifyCollection();
      setIsCollectionVerified(exists);
      console.log("Collection verified:", exists);
    } catch (error) {
      console.error("Error checking collection:", error);
      setIsCollectionVerified(false);
    } finally {
      setCheckingCollection(false);
    }
  };

  const checkUserAccountExists = async () => {
    if (!user.address) return;
    
    try {
      // Check if the wallet's account exists on devnet
      const accountResponse = await fetch(`${networkConfig.nodeUrl}/accounts/${user.address}`);
      const accountExists = accountResponse.ok;
      
      console.log("User account exists on devnet:", accountExists);
      
      if (!accountExists) {
        setError("Your account doesn't exist on devnet yet. Click 'Fund Account from Faucet' to create it.");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error checking user account:", err);
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if the Petra wallet is available
      if (window.aptos) {
        const response = await window.aptos.connect();
        setUser({ address: response.address });
        console.log("Connected to Aptos wallet:", response.address);
        console.log("Network info:", networkConfig);
        await checkNetwork();
      } else {
        throw new Error(
          "Petra wallet not found. Please install Petra extension."
        );
      }
    } catch (err: any) {
      console.error("Error connecting to Aptos wallet:", err);
      setError(err.message || "Failed to connect to Aptos wallet");
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.aptos) {
        await window.aptos.disconnect();
        setUser({});
        setMintTxStatus(null);
        setMintTxHash(null);
        setCurrentNetwork(null);
        setIsCorrectNetwork(false);
        setIsCollectionVerified(null);
      }
    } catch (err: any) {
      console.error("Error disconnecting from Aptos wallet:", err);
    }
  };

  const mintNFT = async () => {
    if (!user.address || !selectedNftId || !isCorrectNetwork) return;
    
    // Validate account exists first
    const accountResponse = await fetch(`${networkConfig.nodeUrl}/accounts/${user.address}`);
    if (!accountResponse.ok) {
      setError("Your account doesn't exist on devnet. Please fund it first.");
      const fundAccount = window.confirm("Your account needs to be funded on devnet. Open the faucet site now?");
      if (fundAccount) {
        window.open(`${networkConfig.faucetUrl}?address=${user.address}`, '_blank');
      }
      return;
    }
    
    // Verify the contract module first
    const moduleValid = await checkContractModule();
    if (!moduleValid) {
      // Error already set by checkContractModule
      return;
    }
    
    setLoading(true);
    setError(null);
    setMintTxStatus("Preparing transaction...");
    
    try {
      // Get random token ID to ensure uniqueness
      const tokenId = Math.floor(Math.random() * 10000) + 1;
      console.log(`Creating NFT with ID: ${tokenId} for Flow NFT #${selectedNftId}`);
      console.log(`Using contract address: ${CONTRACT_ADDRESS}`);
      console.log(`Using collection name: ${COLLECTION_NAME}`);
      
      // Try a simplified version of the transaction
      // The mint_token function requires more parameters based on the contract
      const simplifiedPayload = {
        function: `${CONTRACT_ADDRESS}::ufc_nft::mint_token`,
        type_arguments: [],
        arguments: [
          tokenId.toString(),                                  // u64 token_id
          `Flow Bridge NFT #${selectedNftId}`,                 // name
          `UFC NFT bridged from Flow (ID: ${selectedNftId})`,  // description
          `https://ufc-nft-bridge.example/metadata/${selectedNftId}`, // uri
          `UFC Fighter ${selectedNftId}`,                      // fighter_name 
          "Heavyweight",                                       // weight_class
          "25-0",                                              // record
          "1",                                                 // ranking
          "1"                                                  // quantity
        ],
      };
      
      console.log("Transaction payload:", JSON.stringify(simplifiedPayload, null, 2));
      setMintTxStatus("Waiting for wallet approval...");

      // Use Petra wallet to sign and submit transaction
      const response = await window.aptos!.signAndSubmitTransaction(simplifiedPayload);
      
      setMintTxHash(response.hash);
      setMintTxStatus("Transaction submitted! Waiting for confirmation...");
      
      // Wait for transaction to be confirmed
      const txnInfo = await aptos.waitForTransaction({transactionHash: response.hash});
      console.log("Transaction confirmed:", txnInfo);
      
      setMintTxStatus("NFT successfully minted!");
      alert(`Successfully minted UFC NFT on Aptos representing Flow NFT #${selectedNftId}`);
      
    } catch (err: any) {
      console.error("Error minting NFT:", err);
      
      // Try alternative method if the first fails
      if (err.message && err.message.includes("object does not exist")) {
        return tryAlternativeMint();
      }
      
      // Attempt to parse the detailed error if available
      let errorJson = null;
      try {
        if (err.message && err.message.includes('{')) {
          const errorStart = err.message.indexOf('{');
          const errorText = err.message.substring(errorStart);
          errorJson = JSON.parse(errorText);
          console.log("Parsed error details:", errorJson);
        }
      } catch (parseErr) {
        console.log("Could not parse error JSON:", parseErr);
      }
      
      // Handle specific error messages
      let errorMessage = err.message || "Failed to mint NFT";
      let needsFunding = false;
      
      // Try to extract more useful error information
      if (errorMessage.includes("Function not found")) {
        errorMessage = "Function not found. Check contract address and network.";
      } else if (errorMessage.includes("Cannot find module")) {
        errorMessage = "Contract module not found at specified address.";
      } else if (errorMessage.includes("collection does not exist")) {
        errorMessage = `Collection "${COLLECTION_NAME}" does not exist for this contract.`;
      } else if (errorMessage.includes("Account not found") || errorMessage.includes("account_not_found")) {
        errorMessage = "Your account doesn't exist on devnet yet. You need to fund it first.";
        needsFunding = true;
      } else if (errorMessage.includes("object does not exist")) {
        errorMessage = "An object referenced in the transaction doesn't exist. The collection may not be properly set up.";
      } else if (errorJson && errorJson.message) {
        errorMessage = errorJson.message;
      }
      
      setError(errorMessage);
      setMintTxStatus("Transaction failed");
      
      if (needsFunding) {
        const fundAccount = window.confirm("Your account needs to be funded on devnet. Open the faucet site now?");
        if (fundAccount) {
          window.open(`${networkConfig.faucetUrl}?address=${user.address}`, '_blank');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Try an alternative mint function with different parameters
  const tryAlternativeMint = async () => {
    setMintTxStatus("Trying alternative minting method...");
    setError(null);
    
    try {
      // A different function might be available in the contract
      // or a different parameter format might be needed
      const tokenId = Math.floor(Math.random() * 10000) + 1;
      
      // Use mint_token_for as an alternative which requires the wallet address
      const minimalPayload = {
        function: `${CONTRACT_ADDRESS}::ufc_nft::mint_token_for`,
        type_arguments: [],
        arguments: [
          user.address,                                       // address recipient
          tokenId.toString(),                                 // u64 token_id
          `Flow Bridge NFT #${selectedNftId}`,                // name
          `UFC NFT bridged from Flow (ID: ${selectedNftId})`, // description  
          `https://ufc-nft-bridge.example/metadata/${selectedNftId}`, // uri
          `UFC Fighter ${selectedNftId}`,                     // fighter_name
          "Heavyweight",                                      // weight_class
          "25-0",                                             // record
          "1",                                                // ranking
          "1"                                                 // quantity
        ],
      };
      
      console.log("Alternative payload:", JSON.stringify(minimalPayload, null, 2));
      setMintTxStatus("Waiting for wallet approval (alternative method)...");
      
      const response = await window.aptos!.signAndSubmitTransaction(minimalPayload);
      
      setMintTxHash(response.hash);
      setMintTxStatus("Transaction submitted! Waiting for confirmation...");
      
      // Wait for transaction to be confirmed
      const txnInfo = await aptos.waitForTransaction({transactionHash: response.hash});
      console.log("Transaction confirmed:", txnInfo);
      
      setMintTxStatus("NFT successfully minted with alternative method!");
      alert(`Successfully minted UFC NFT on Aptos representing Flow NFT #${selectedNftId}`);
      return true;
    } catch (err: any) {
      console.error("Alternative minting also failed:", err);
      setError(`Alternative minting also failed: ${err.message}`);
      setMintTxStatus("All minting attempts failed");
      return false;
    }
  };

  const checkContractModule = async () => {
    try {
      setMintTxStatus("Verifying contract...");
      
      // Check for the contract module
      const moduleUrl = `${networkConfig.nodeUrl}/accounts/${CONTRACT_ADDRESS}/module/ufc_nft`;
      const moduleResponse = await fetch(moduleUrl);
      
      if (!moduleResponse.ok) {
        setError(`Contract module not found at address ${CONTRACT_ADDRESS}`);
        setMintTxStatus(null);
        return false;
      }
      
      // Check for the mint function within the module
      const moduleData = await moduleResponse.json();
      console.log("Contract module:", moduleData);
      
      // Get the exposed functions from the module
      const exposedFunctions = moduleData.abi?.exposed_functions || [];
      console.log("Available functions:", exposedFunctions.map((f: any) => f.name));
      
      // Look for any mint-related function
      const mintFunctions = exposedFunctions.filter((f: any) => 
        f.name.includes("mint") || 
        f.name.includes("create") || 
        f.name.includes("token")
      );
      
      if (mintFunctions.length > 0) {
        console.log("Found potential mint functions:", mintFunctions);
        // Update our mint function name based on what's available
        const functionsStr = mintFunctions.map((f: any) => f.name).join(", ");
        setMintTxStatus(`Found potential mint functions: ${functionsStr}`);
        setTimeout(() => setMintTxStatus(null), 5000);
        return true;
      }
      
      const mintFunction = exposedFunctions.find((f: any) => f.name === "mint_token");
      
      if (!mintFunction) {
        setError(`Function mint_token not found in the contract module. Available functions: ${exposedFunctions.map((f: any) => f.name).join(", ")}`);
        setMintTxStatus(null);
        return false;
      }
      
      console.log("Found mint function:", mintFunction);
      setMintTxStatus(null);
      return true;
    } catch (err) {
      console.error("Error verifying contract:", err);
      setError("Failed to verify contract module");
      setMintTxStatus(null);
      return false;
    }
  };

  // If not yet on client, show a loading state that matches server output
  if (!isClient) {
    return (
      <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Aptos Wallet</h1>
        <div className="mb-6">
          <p className="text-gray-300">Loading wallet connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <h1 className="text-2xl font-bold mb-4 text-white">Bridge NFT to Aptos</h1>

      <div className="mb-6">
        <p className="text-gray-300">
          Selected Flow NFT:{" "}
          {selectedNftId ? (
            <span className="font-medium text-blue-400">#{selectedNftId}</span>
          ) : (
            <span className="text-red-400">No NFT selected</span>
          )}
        </p>
        <Link href="/" className="text-blue-400 hover:underline text-sm">
          ← Back to Flow NFTs
        </Link>
      </div>

      <div className="p-3 bg-yellow-900 border border-yellow-700 rounded mb-4">
        <p className="text-sm font-bold text-yellow-300">
          IMPORTANT: USE DEVNET
        </p>
        <p className="text-xs text-yellow-400 mt-1">
          This bridge only works with Petra Wallet connected to Aptos Devnet.
          Please switch your wallet to Devnet before connecting.
        </p>
      </div>

      {error && (
        <div className="bg-red-900 text-red-300 p-3 rounded mb-4">
          <p>{error}</p>
          {error.includes("object does not exist") && (
            <button
              onClick={tryAlternativeMint}
              className="mt-2 px-4 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 w-full"
            >
              Try Alternative Minting Method
            </button>
          )}
        </div>
      )}

      {mintTxStatus && (
        <div className="p-3 bg-blue-900 border border-blue-800 rounded mb-4">
          <p className="text-sm text-blue-300">
            <span className="font-medium">Status:</span> {mintTxStatus}
          </p>
          {mintTxHash && (
            <a
              href={`${networkConfig.explorerUrl}txn/${mintTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline mt-1 block"
            >
              View transaction on Explorer ↗
            </a>
          )}
        </div>
      )}

      {user.address ? (
        <>
          <div className="p-3 bg-gray-700 rounded mb-4">
            <p className="font-medium text-purple-300">Connected Aptos address:</p>
            <p className="text-sm font-mono break-all text-gray-300">{user.address}</p>
            <a
              href={`${networkConfig.explorerUrl}account/${user.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline"
            >
              View on Explorer ↗
            </a>
          </div>

          {currentNetwork && (
            <div
              className={`p-3 ${
                isCorrectNetwork ? "bg-green-900" : "bg-red-900"
              } rounded mb-4`}
            >
              <p
                className={`text-sm ${
                  isCorrectNetwork ? "text-green-300" : "text-red-300"
                }`}
              >
                <span className="font-medium">Network:</span> {currentNetwork}
                {isCorrectNetwork ? (
                  <span className="ml-2 text-green-300">✓</span>
                ) : (
                  <span className="ml-2 text-red-300">
                    ✗ Need to switch to {REQUIRED_NETWORK}
                  </span>
                )}
              </p>
              
              {isCorrectNetwork && (
                <button
                  onClick={() => window.open(`${networkConfig.faucetUrl}?address=${user.address}`, '_blank')}
                  className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Fund Account from Faucet
                </button>
              )}
            </div>
          )}

          {checkingCollection ? (
            <div className="p-3 bg-gray-700 rounded mb-4">
              <p className="text-sm text-gray-300">
                <span className="font-medium">
                  Checking "UFC Collection" existence...
                </span>
              </p>
            </div>
          ) : isCollectionVerified ? (
            <div className="p-3 bg-green-900 rounded mb-4">
              <p className="text-sm text-green-300">
                <span className="font-medium">✓</span> Using existing "UFC
                Collection"
              </p>
              <p className="text-xs text-green-400 mt-1">
                Contract: {CONTRACT_ADDRESS.substring(0, 10)}...
                {CONTRACT_ADDRESS.substring(CONTRACT_ADDRESS.length - 6)}
              </p>
              <button
                onClick={checkContractModule}
                className="mt-1 text-xs text-blue-400 hover:underline"
              >
                Verify Contract Module
              </button>
            </div>
          ) : (
            <div className="p-3 bg-yellow-900 rounded mb-4">
              <p className="text-sm text-yellow-300">
                <span className="font-medium">!</span> Could not verify "UFC
                Collection"
              </p>
              <p className="text-xs text-yellow-400 mt-1">
                Contract address: {CONTRACT_ADDRESS.substring(0, 10)}...
                {CONTRACT_ADDRESS.substring(CONTRACT_ADDRESS.length - 6)}
              </p>
              <p className="text-xs text-yellow-400 mt-1">
                Minting may still work even if verification fails.
              </p>
              <div className="flex space-x-2 mt-1">
                <button
                  onClick={checkCollection}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Check Collection Again
                </button>
                <button
                  onClick={checkContractModule}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Verify Contract Module
                </button>
              </div>
            </div>
          )}

          <button
            onClick={disconnectWallet}
            className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full"
          >
            Disconnect Aptos Wallet
          </button>

          <button
            onClick={mintNFT}
            disabled={loading || !selectedNftId || !isCorrectNetwork}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : !isCorrectNetwork
              ? "Switch to Devnet to Mint"
              : "Mint UFC NFT on Aptos"}
          </button>
        </>
      ) : (
        <button
          onClick={connectWallet}
          disabled={loading || !selectedNftId}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {loading ? "Connecting..." : "Connect Aptos Wallet"}
        </button>
      )}
    </div>
  );
};

// Use No-SSR approach for the component
export const AptosWallet = dynamic(() => Promise.resolve(AptosWalletClient), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <h1 className="text-2xl font-bold mb-4 text-white">Connect Aptos Wallet</h1>
      <div className="mb-6">
        <p className="text-gray-300">Loading wallet connection...</p>
      </div>
    </div>
  ),
});

// TypeScript declarations are already handled in src/types/petra.d.ts
