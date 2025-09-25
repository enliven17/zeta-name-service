import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { RainbowProvider } from "@/contexts/RainbowProvider";
import { ClientLoadingManager } from "@/components/ClientLoadingManager";

export const metadata: Metadata = {
  title: "Zeta Name Service",
  description: "Get your own .zeta domain on Arbitrum Sepolia with ZetaChain integration",
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
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
