export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900">
      <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Aptos Wallet</h1>
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-600 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="ml-2 text-gray-300">Loading wallet connection...</p>
          </div>
        </div>
      </div>
    </main>
  );
} 