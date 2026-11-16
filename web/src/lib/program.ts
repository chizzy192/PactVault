import { AnchorProvider, Program, type Wallet } from "@anchor-lang/core";
import { Connection, PublicKey } from "@solana/web3.js";

import idlJson from "@/idl/pact_vault.json";
import type { PactVault } from "@/idl/pact_vault";

/**
 * Typed Anchor client for the PactVault program (same @anchor-lang/core
 * version as program/tests). The IDL is copied from program/target with
 * `npm run sync-idl` after each `anchor build`.
 */
export const idl = idlJson as PactVault;
export const PROGRAM_ID = new PublicKey(idl.address);

export const [POOL_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool")],
  PROGRAM_ID
);

/** Read-only client (fetch accounts). Pass a wallet to send transactions. */
export function getProgram(connection: Connection, wallet?: Wallet) {
  if (wallet) {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    return new Program<PactVault>(idl, provider);
  }
  return new Program<PactVault>(idl, { connection });
}
