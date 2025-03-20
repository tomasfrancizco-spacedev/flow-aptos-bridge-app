"use client";
import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { FlowNFTs } from "./FlowNFTs";

// Client-side only component
const FlowWalletClient = () => {
  const [user, setUser] = useState<{ loggedIn?: boolean; addr?: string }>({});
  const [fcl, setFcl] = useState<any>(null);

  useEffect(() => {
    // Import FCL only on client-side
    const loadFcl = async () => {
      const fclModule = await import("@onflow/fcl");
      // Import config after FCL is loaded
      await import("../lib/fclConfig");
      setFcl(fclModule);
      fclModule.currentUser.subscribe(setUser);
    };
    
    loadFcl();
  }, []);

  const handleLogin = () => fcl?.authenticate();
  const handleLogout = () => fcl?.unauthenticate();

  if (!fcl) return <div className="text-white">Loading wallet...</div>;

  return (
    <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <h1 className="text-2xl font-bold mb-4 text-white">Flow NFT Bridge</h1>
      
      {user.loggedIn ? (
        <>
          <div className="p-3 bg-gray-700 rounded mb-4">
            <p className="font-medium text-blue-300">Connected address:</p>
            <p className="text-sm font-mono break-all text-gray-300">{user.addr}</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="mb-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full"
          >
            Disconnect Flow Wallet
          </button>
          
          {/* Show NFTs when connected */}
          <FlowNFTs userAddress={user.addr} />
        </>
      ) : (
        <button 
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
        >
          Connect Flow Wallet
        </button>
      )}
    </div>
  );
};

// Export a wrapper component that only renders on client-side
export const FlowWallet = dynamic(() => Promise.resolve(FlowWalletClient), {
  ssr: false
});