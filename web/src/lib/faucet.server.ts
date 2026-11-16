import "server-only";

import {
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import {
  FAUCET_USDC_AMOUNT,
  RPC_URL,
  USDC_DECIMALS,
  USDC_MINT,
} from "@/lib/config";

const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

/** Top up wallets below this balance so new users can pay fees. */
const SOL_THRESHOLD_LAMPORTS = 0.01 * LAMPORTS_PER_SOL;
const SOL_TOPUP_LAMPORTS = 0.05 * LAMPORTS_PER_SOL;
/** Keep enough for ~a few dozen transactions + token account rent. */
const FAUCET_MIN_SOL_LAMPORTS = 0.06 * LAMPORTS_PER_SOL;

const HOUR_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_IP_PER_HOUR = 5;

/** A failure the API can report to the user as-is. */
export class FaucetError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number
  ) {
    super(message);
  }
}

// ---------- configuration (server only) ----------

let faucetKeypair: Keypair | undefined;
function getFaucetKeypair(): Keypair {
  if (faucetKeypair) return faucetKeypair;
  const raw = process.env.FAUCET_SECRET_KEY;
  if (!raw) {
    throw new FaucetError("The faucet is not configured on this server.", 503);
  }
  try {
    const bytes = Uint8Array.from(JSON.parse(raw) as number[]);
    faucetKeypair = Keypair.fromSecretKey(bytes);
  } catch {
    throw new FaucetError("The faucet key on this server is invalid.", 503);
  }
  return faucetKeypair;
}

let connection: Connection | undefined;
let verified = false;
/** Devnet connection whose genesis hash and mint authority have been checked. */
async function getVerifiedConnection(faucet: Keypair): Promise<Connection> {
  connection ??= new Connection(RPC_URL, "confirmed");
  if (verified) return connection;

  if ((await connection.getGenesisHash()) !== DEVNET_GENESIS_HASH) {
    throw new FaucetError("The configured RPC is not Solana devnet.", 503);
  }
  const mint = await getMint(connection, USDC_MINT);
  if (!mint.mintAuthority?.equals(faucet.publicKey)) {
    throw new FaucetError(
      "The faucet key is not the mint authority for test USDC.",
      503
    );
  }
  if (mint.decimals !== USDC_DECIMALS) {
    throw new FaucetError("The test USDC mint has unexpected decimals.", 503);
  }
  verified = true;
  return connection;
}

// ---------- validation ----------

/** Parses a wallet address; rejects off-curve addresses (PDAs have no owner key). */
export function parseWalletAddress(value: unknown): PublicKey {
  if (typeof value !== "string" || value.length < 32 || value.length > 44) {
    throw new FaucetError("Enter a valid Solana wallet address.", 400);
  }
  let key: PublicKey;
  try {
    key = new PublicKey(value);
  } catch {
    throw new FaucetError("Enter a valid Solana wallet address.", 400);
  }
  if (!PublicKey.isOnCurve(key.toBytes())) {
    throw new FaucetError(
      "That address is a program account, not a wallet.",
      400
    );
  }
  return key;
}

// ---------- rate limits (in memory; reset when the server restarts) ----------

const lastRequestByWallet = new Map<string, number>();
const requestsByIp = new Map<string, number[]>();

function secondsUntil(timestampMs: number) {
  return Math.max(1, Math.ceil((timestampMs - Date.now()) / 1000));
}

/**
 * Reserves a slot for this wallet and IP, or throws 429.
 * Returns a release function to call if the request then fails.
 */
function reserveSlot(wallet: string, ip: string): () => void {
  const now = Date.now();

  const last = lastRequestByWallet.get(wallet);
  if (last !== undefined && now - last < HOUR_MS) {
    const retry = secondsUntil(last + HOUR_MS);
    throw new FaucetError(
      "This wallet already received test USDC in the last hour.",
      429,
      retry
    );
  }

  const recent = (requestsByIp.get(ip) ?? []).filter((t) => now - t < HOUR_MS);
  if (recent.length >= MAX_REQUESTS_PER_IP_PER_HOUR) {
    const retry = secondsUntil(recent[0] + HOUR_MS);
    throw new FaucetError(
      "Too many faucet requests from your network. Try again later.",
      429,
      retry
    );
  }

  lastRequestByWallet.set(wallet, now);
  recent.push(now);
  requestsByIp.set(ip, recent);

  return () => {
    if (lastRequestByWallet.get(wallet) === now) {
      lastRequestByWallet.delete(wallet);
    }
    const list = requestsByIp.get(ip);
    const index = list?.lastIndexOf(now) ?? -1;
    if (list && index >= 0) list.splice(index, 1);
  };
}

// ---------- the faucet ----------

export type FaucetResult = {
  signature: string;
  usdc: number;
  solSent: number;
};

export async function requestFromFaucet(
  wallet: PublicKey,
  ip: string
): Promise<FaucetResult> {
  const faucet = getFaucetKeypair();
  const release = reserveSlot(wallet.toBase58(), ip);

  try {
    const conn = await getVerifiedConnection(faucet);

    const [walletLamports, faucetLamports] = await Promise.all([
      conn.getBalance(wallet),
      conn.getBalance(faucet.publicKey),
    ]);
    const sendSol = walletLamports < SOL_THRESHOLD_LAMPORTS;
    const needed = FAUCET_MIN_SOL_LAMPORTS + (sendSol ? SOL_TOPUP_LAMPORTS : 0);
    if (faucetLamports < needed) {
      throw new FaucetError(
        "The faucet is out of devnet SOL. Please try again later.",
        503
      );
    }

    const tokenAccount = getAssociatedTokenAddressSync(USDC_MINT, wallet);
    const tx = new Transaction().add(
      // No-op if the wallet already has its test USDC account.
      createAssociatedTokenAccountIdempotentInstruction(
        faucet.publicKey,
        tokenAccount,
        wallet,
        USDC_MINT
      ),
      createMintToCheckedInstruction(
        USDC_MINT,
        tokenAccount,
        faucet.publicKey,
        BigInt(FAUCET_USDC_AMOUNT) * BigInt(10 ** USDC_DECIMALS),
        USDC_DECIMALS
      )
    );
    if (sendSol) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: faucet.publicKey,
          toPubkey: wallet,
          lamports: SOL_TOPUP_LAMPORTS,
        })
      );
    }

    const signature = await sendAndConfirmTransaction(conn, tx, [faucet], {
      commitment: "confirmed",
    });
    return {
      signature,
      usdc: FAUCET_USDC_AMOUNT,
      solSent: sendSol ? SOL_TOPUP_LAMPORTS / LAMPORTS_PER_SOL : 0,
    };
  } catch (error) {
    release();
    if (error instanceof FaucetError) throw error;
    console.error("[faucet] request failed", error);
    throw new FaucetError(
      "Devnet did not confirm the transaction. Please try again.",
      502
    );
  }
}
