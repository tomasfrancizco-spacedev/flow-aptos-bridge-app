/**
 * Type definitions for Petra Wallet
 * 
 * This file provides TypeScript declarations for the Petra wallet
 * which is injected into the window object.
 */

interface AptosAccount {
  address: string;
  publicKey: string;
}

interface PetraWallet {
  connect: () => Promise<AptosAccount>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
  account: () => Promise<AptosAccount>;
  signAndSubmitTransaction: (transaction: any) => Promise<{hash: string}>;
  signTransaction: (transaction: any) => Promise<any>;
  signMessage: (message: {message: string}) => Promise<{signature: string; fullMessage: string}>;
  network: () => Promise<{name: string; chainId: string; url: string}>;
}

// Add type declarations to the Window interface
declare global {
  interface Window {
    aptos?: PetraWallet;
  }
}

export {}; 