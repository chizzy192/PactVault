import { PublicKey } from "@solana/web3.js";

/**
 * Public, browser-safe configuration. PactVault runs on Solana devnet only:
 * any RPC URL that is not a devnet URL is rejected at startup.
 */

const DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com";

// process.env.NEXT_PUBLIC_* must be referenced literally so Next can inline it.
const rpcFromEnv = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
export const RPC_URL = rpcFromEnv ? rpcFromEnv : DEFAULT_DEVNET_RPC;

if (!/devnet/i.test(RPC_URL)) {
  throw new Error(
    `NEXT_PUBLIC_SOLANA_RPC_URL must be a Solana devnet URL (got "${RPC_URL}").`
  );
}

const mintFromEnv = process.env.NEXT_PUBLIC_USDC_MINT?.trim();
if (!mintFromEnv) {
  throw new Error(
    "NEXT_PUBLIC_USDC_MINT is not set. Copy web/.env.example to web/.env.local."
  );
}
export const USDC_MINT = new PublicKey(mintFromEnv);
export const USDC_DECIMALS = 6;

/** Amount the faucet mints per request, in whole test USDC. */
export const FAUCET_USDC_AMOUNT = 1_000;

export const explorerTxUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

export const explorerAddressUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}?cluster=devnet`;
