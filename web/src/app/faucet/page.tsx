import type { Metadata } from "next";

import { FaucetPanel } from "@/components/faucet-panel";

export const metadata: Metadata = {
  title: "Test USDC faucet",
  description: "Get free test USDC and devnet SOL to try PactVault.",
};

export default function FaucetPage() {
  return (
    <main className="mx-auto grid w-full max-w-2xl flex-1 content-start gap-8 px-5 pt-14 pb-20 sm:px-8 lg:pt-20">
      <div className="grid gap-3">
        <h1 className="text-[clamp(2rem,4.5vw,2.75rem)] leading-tight font-semibold tracking-[-0.03em]">
          Test USDC faucet
        </h1>
        <p className="max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
          PactVault runs on Solana devnet. Get free test USDC to lock in a
          pact, plus a little SOL for fees if you need it.
        </p>
      </div>
      <FaucetPanel />
    </main>
  );
}
