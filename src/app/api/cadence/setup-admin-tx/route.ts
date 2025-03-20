import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/cadence/transactions/setup_admin.cdc');
    const txContent = fs.readFileSync(filePath, 'utf8');
    
    console.log('Setup Admin transaction content:', txContent);
    
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