import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { RainbowProvider } from "@/contexts/RainbowProvider";
import { ClientLoadingManager } from "@/components/ClientLoadingManager";

export const metadata: Metadata = {
  title: "Zeta Name Service - Omnichain Domains",
  description: "Register and manage .zeta domains across multiple blockchains with ZetaChain's omnichain technology. Trade domains seamlessly on Arbitrum Sepolia, ZetaChain, and more.",
  keywords: "zeta, zetachain, omnichain, domains, blockchain, arbitrum, sepolia, cross-chain, web3, nft",
  authors: [{ name: "Zeta Name Service Team" }],
  openGraph: {
    title: "Zeta Name Service - Omnichain Domains",
    description: "Register and manage .zeta domains across multiple blockchains with ZetaChain's omnichain technology.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zeta Name Service - Omnichain Domains",
    description: "Register and manage .zeta domains across multiple blockchains with ZetaChain's omnichain technology.",
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="font-sans antialiased">
        <RainbowProvider>
          <WalletProvider>
            <ClientLoadingManager />
            {children}
          </WalletProvider>
        </RainbowProvider>
      </body>
    </html>
  );
}
