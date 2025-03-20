import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * This API endpoint serves the mint_nft.cdc transaction.
 * The transaction is configured to use the public minting function for existing series and sets:
 * - seriesId: 1 - "UFC Series #1"
 * - setId: 1 - "UFC Fight Moments"
 * 
 * This approach doesn't require admin privileges, allowing any user to mint NFTs
 * as long as the UFC_NFT contract has the publicMintNFT function available.
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/cadence/transactions/mint_nft.cdc');
    const txContent = fs.readFileSync(filePath, 'utf8');
    
    console.log('Mint NFT transaction content:', txContent);
    
    return new NextResponse(txContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading Cadence transaction:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to load transaction' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 