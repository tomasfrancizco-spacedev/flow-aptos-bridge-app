import '@/styles/globals.css';

export const metadata = {
  title: 'UFC NFT Bridge',
  description: 'Bridge your UFC NFTs between Flow and Aptos blockchains',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900">{children}</body>
    </html>
  )
}
