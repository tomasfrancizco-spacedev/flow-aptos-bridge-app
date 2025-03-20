import { AptosWallet } from "@/components/AptosWallet";

// Mark the page as not being static to prevent hydration issues
export const dynamic = 'force-dynamic';

export default function AptosConnect() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900">
      <AptosWallet />
    </main>
  );
} 