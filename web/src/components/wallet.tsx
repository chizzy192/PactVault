"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { explorerAddressUrl } from "@/lib/config";

export const shortAddress = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;

/** Green primary action that opens the wallet picker (Phantom etc.). */
export function ConnectWalletButton({ className }: { className?: string }) {
  const { connecting } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <Button
      size="lg"
      className={className}
      disabled={connecting}
      onClick={() => setVisible(true)}
    >
      <Wallet aria-hidden />
      {connecting ? "Connecting…" : "Connect wallet"}
    </Button>
  );
}

/** Blue identity badge for the connected wallet, with a quiet disconnect. */
export function ConnectedWallet() {
  const { publicKey, disconnect, wallet } = useWallet();
  if (!publicKey) return null;
  const address = publicKey.toBase58();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Badge
        variant="info"
        className="h-7 gap-1.5 px-2.5 text-sm"
        render={
          <a
            href={explorerAddressUrl(address)}
            target="_blank"
            rel="noreferrer"
            title={`${address} on Solana Explorer (devnet)`}
          />
        }
      >
        {wallet?.adapter.icon ? (
          // eslint-disable-next-line @next/next/no-img-element -- wallet-provided data URI
          <img src={wallet.adapter.icon} alt="" className="size-4 rounded-sm" />
        ) : (
          <Wallet aria-hidden />
        )}
        <span className="font-mono tabular-nums">{shortAddress(address)}</span>
      </Badge>
      <button
        type="button"
        onClick={() => void disconnect()}
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Disconnect
      </button>
    </div>
  );
}
