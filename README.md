# UFC NFT Bridge

### Website [here](https://flow-aptos-bridge-app.vercel.app/)

A bridge for transferring UFC NFTs between Flow and Aptos blockchains. This application demonstrates cross-chain NFT bridging capabilities.

## ⚠️ IMPORTANT: APTOS DEVNET REQUIRED ⚠️

This application requires the Petra wallet to be connected to **Aptos Devnet**. The bridge will not work on Mainnet or other networks.

Please ensure your Petra wallet is set to Devnet before attempting to use this application.

## Features

- Select and view UFC NFTs from Flow blockchain
- Bridge selected Flow NFTs to Aptos blockchain (Devnet)
- Mint new UFC NFTs on Aptos that represent the bridged Flow NFTs
- Uses the existing "UFC Collection" on Aptos Devnet

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [Flow CLI](https://docs.onflow.org/flow-cli/install/) for Flow blockchain interaction
- [Petra Wallet](https://petra.app/) browser extension for Aptos blockchain interaction
  - **Must be configured to use Devnet**
- [Flow Wallet](https://docs.onflow.org/flow-wallet/) for Flow blockchain interaction

## Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/ufc-nft-bridge.git
cd ufc-nft-bridge
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Bridging an NFT from Flow to Aptos

1. Connect your Flow wallet **on Testnet** on the home page.
2. Mint a UFC NFT on Flow or select one from your existing collection.
3. Click "Bridge to Aptos" on the desired NFT card.
4. You'll be redirected to the Aptos connect page.
5. **Ensure your Petra wallet is set to Devnet** before connecting.
6. Connect your Petra wallet.
7. Click "Mint UFC NFT on Aptos" to complete the bridge process.
8. The NFT will be minted on Aptos with metadata referencing the original Flow NFT.

## Project Structure

- `src/app`: Next.js application pages and routes
- `src/components`: React components
- `src/cadence`: Cadence smart contracts for Flow blockchain
- `src/aptos`: Move smart contracts for Aptos blockchain 
- `src/lib`: Utility functions and configuration
- `src/types`: TypeScript type definitions

## Smart Contracts

### Flow Contracts

Located in `src/cadence/contracts`. The main contract is `UFC_NFT.cdc` which handles the NFT functionality on Flow. The contract is already deployed at address `0xd049c2e1e3ec47da` on **Flow Testnet**.

### Aptos Contracts

Located in `src/aptos/sources`. The main module is `UFC_NFT.move` which implements the NFT functionality on Aptos. The contract is already deployed at address `0x5b4b6e2e43bd03f96692402f36c0103349c87dde06cb921552dace4db9dbf8cc` with a collection named "UFC Collection" on **Aptos Devnet**.

## Aptos Integration Details

The application uses the Petra wallet to interact with the Aptos blockchain. When minting an NFT on Aptos:

1. We use the existing "UFC Collection" that's already deployed on Devnet
2. We generate a unique ID for each NFT to prevent collisions
3. We include references to the original Flow NFT in the metadata
4. Minting is done through the `mint_token_for` function in the UFC_NFT contract

## Troubleshooting

- **"Account not found by address"**: This error occurs if your Petra wallet is not set to Devnet. Switch your wallet network to Devnet and try again.
- **"Collection not found"**: The application verifies the existence of the UFC Collection on Devnet. If it can't be found, check that you're using the correct network and contract address.

## License

[MIT](LICENSE)
