/**
 * One-time setup: creates the PactVault pool on devnet.
 *
 *   cd program
 *   yarn ts-node scripts/init-devnet.ts <TEST_USDC_MINT>
 *
 * Signs with the admin wallet at ~/.config/solana/id.json (override with
 * ANCHOR_WALLET). Uses https://api.devnet.solana.com unless
 * ANCHOR_PROVIDER_URL is set; refuses any URL that is not devnet.
 * Safe to re-run: exits without changes if the pool already exists.
 */
import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { getMint } from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { PactVault } from "../target/types/pact_vault";

const idl: PactVault = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../target/idl/pact_vault.json"), "utf8")
);

const ADVANCE_BPS = 8000;
const FEE_BPS = 300;
const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

async function main() {
  const mintArg = process.argv[2];
  if (!mintArg) {
    throw new Error("Usage: yarn ts-node scripts/init-devnet.ts <MINT>");
  }
  const mint = new anchor.web3.PublicKey(mintArg);

  const url =
    process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com";
  if (!url.includes("devnet")) {
    throw new Error(`Refusing to run against a non-devnet RPC: ${url}`);
  }
  const connection = new anchor.web3.Connection(url, "confirmed");
  if ((await connection.getGenesisHash()) !== DEVNET_GENESIS_HASH) {
    throw new Error(`RPC ${url} is not Solana devnet (genesis hash mismatch)`);
  }

  const walletPath =
    process.env.ANCHOR_WALLET ??
    path.join(os.homedir(), ".config", "solana", "id.json");
  const admin = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf8")))
  );
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(admin),
    { commitment: "confirmed" }
  );
  const program = new Program<PactVault>(idl, provider);

  const [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pool")],
    program.programId
  );
  const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault")],
    program.programId
  );

  console.log("RPC:       ", url);
  console.log("Program:   ", program.programId.toBase58());
  console.log("Admin:     ", admin.publicKey.toBase58());
  console.log("Mint:      ", mint.toBase58());
  console.log("Pool PDA:  ", poolPda.toBase58());
  console.log("Pool vault:", vaultPda.toBase58());

  const existing = await program.account.pool.fetchNullable(poolPda);
  if (existing) {
    console.log("\nPool already exists; nothing to do.");
    console.log("  mint:", existing.mint.toBase58());
    console.log(
      "  advance_bps:",
      existing.advanceBps,
      "fee_bps:",
      existing.feeBps
    );
    return;
  }

  const mintInfo = await getMint(connection, mint);
  if (mintInfo.decimals !== 6) {
    throw new Error(`Mint has ${mintInfo.decimals} decimals; expected 6`);
  }

  const signature = await program.methods
    .initPool(ADVANCE_BPS, FEE_BPS)
    .accountsPartial({
      admin: admin.publicKey,
      pool: poolPda,
      mint,
      vault: vaultPda,
    })
    .rpc();
  console.log("\ninit_pool signature:", signature);

  const pool = await program.account.pool.fetch(poolPda);
  console.log("Pool created:");
  console.log("  admin:", pool.admin.toBase58());
  console.log("  mint:", pool.mint.toBase58());
  console.log("  advance_bps:", pool.advanceBps, "fee_bps:", pool.feeBps);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
