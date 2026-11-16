"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { RPC_URL } from "@/lib/config";

import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Theme (system by default, manual override) and Solana wallet context.
 * The network is fixed to devnet by RPC_URL. No wallet adapters are listed:
 * Phantom and other Wallet Standard wallets register themselves.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConnectionProvider endpoint={RPC_URL}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}
