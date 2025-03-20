import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/cadence/scripts/get_nfts.cdc');
    const scriptContent = fs.readFileSync(filePath, 'utf8');
    
    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading Cadence script:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to load script' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 