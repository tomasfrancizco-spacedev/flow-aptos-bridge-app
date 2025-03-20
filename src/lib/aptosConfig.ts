import { Aptos, Network, AptosConfig } from "@aptos-labs/ts-sdk";

// Configure Aptos for testnet (devnet)
export const aptos = new Aptos(
  new AptosConfig({ 
    network: Network.DEVNET
  })
);

// Export network configuration for UI display
export const networkConfig = {
  name: "Devnet",
  chainId: "2",
  nodeUrl: "https://fullnode.devnet.aptoslabs.com/v1",
  explorerUrl: "https://explorer.aptoslabs.com/",
  faucetUrl: "https://faucet.devnet.aptoslabs.com"
};

// Alternative API endpoints in case the primary one fails
const alternativeApiEndpoints = [
  "https://api.devnet.aptoslabs.com/v1",
  "https://devnet.aptos-api.com/v1"
];

// Contract constants
export const CONTRACT_ADDRESS = "0x5b4b6e2e43bd03f96692402f36c0103349c87dde06cb921552dace4db9dbf8cc";
export const COLLECTION_NAME = "UFC Collection";
export const FUNCTION_NAME = "mint_token_for"; // The function to call in the contract

// Helper function to verify the collection exists
export async function verifyCollection(): Promise<boolean> {
  // Try the main endpoint first
  const result = await tryVerifyCollection(networkConfig.nodeUrl);
  if (result) return true;
  
  // If the main endpoint fails, try the alternatives
  for (const endpoint of alternativeApiEndpoints) {
    console.log(`Trying alternative endpoint: ${endpoint}`);
    const altResult = await tryVerifyCollection(endpoint);
    if (altResult) return true;
  }
  
  return false;
}

// Helper function to try a specific endpoint
async function tryVerifyCollection(apiEndpoint: string): Promise<boolean> {
  try {
    // First check that the contract account exists
    const accountResponse = await fetch(
      `${apiEndpoint}/accounts/${CONTRACT_ADDRESS}`
    );
    
    if (!accountResponse.ok) {
      console.log(`Contract account not found at ${apiEndpoint}`);
      return false;
    }
    
    // Then check for resources
    const response = await fetch(
      `${apiEndpoint}/accounts/${CONTRACT_ADDRESS}/resources`
    );
    
    console.log(`API Response status from ${apiEndpoint}:`, response.status);
    
    if (!response.ok) {
      console.log(`API request to ${apiEndpoint} failed with status ${response.status}`);
      return false;
    }
    
    const resources = await response.json();
    console.log(`Resources found from ${apiEndpoint}:`, resources.length);
    
    // Log all resource types to help with debugging
    const resourceTypes = resources.map((r: any) => r.type);
    console.log("Resource types:", resourceTypes);

    // Check for token store with collections
    const tokenStoreResource = resources.find(
      (resource: any) => resource.type.includes("0x4::token::TokenStore")
    );

    const collectionResource = resources.find(
      (resource: any) => 
        resource.type.includes("0x4::collection::Collection")
    );

    // If either resource is found, consider it successful
    const hasTokenStore = !!tokenStoreResource;
    const hasCollection = !!collectionResource;
    
    console.log("Found TokenStore:", hasTokenStore);
    console.log("Found Collection:", hasCollection);
    
    // Look for any resource that might indicate the contract exists
    const contractExists = resources.length > 0;
    console.log("Contract exists:", contractExists);

    // Also check for the module specifically
    const moduleEndpoint = `${apiEndpoint}/accounts/${CONTRACT_ADDRESS}/module/ufc_nft`;
    try {
      const moduleResponse = await fetch(moduleEndpoint);
      const moduleExists = moduleResponse.ok;
      console.log("Module exists:", moduleExists);
      if (moduleExists) return true;
    } catch (e) {
      console.log("Error checking module:", e);
    }

    return contractExists;
  } catch (error) {
    console.error(`Error verifying collection with endpoint ${apiEndpoint}:`, error);
    return false;
  }
}

// Helper function to check if your account exists on devnet
export async function checkUserAccount(address: string): Promise<boolean> {
  try {
    const response = await fetch(`${networkConfig.nodeUrl}/accounts/${address}`);
    return response.ok;
  } catch (error) {
    console.error("Error checking user account:", error);
    return false;
  }
}