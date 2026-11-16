"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ConnectedWallet, ConnectWalletButton } from "@/components/wallet";

/** One main action: connect, then the next step points to the faucet. */
export function HomeActions() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="grid gap-3">
        <ConnectWalletButton className="h-11 w-fit px-5 text-[0.95rem]" />
        <p className="text-sm text-muted-foreground">
          Works with Phantom on Solana devnet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <ConnectedWallet />
      <div className="grid gap-2">
        <Link
          href="/faucet"
          className={buttonVariants({
            size: "lg",
            className: "h-11 w-fit px-5 text-[0.95rem]",
          })}
        >
          Get test USDC
          <ArrowRight aria-hidden />
        </Link>
        <p className="text-sm text-muted-foreground">
          Next step: fund your devnet wallet so you can try a pact.
        </p>
      </div>
    </div>
  );
}
