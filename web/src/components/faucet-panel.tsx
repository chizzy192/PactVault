"use client";

import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { CircleAlert, CircleCheck, Clock, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ConnectedWallet,
  ConnectWalletButton,
  shortAddress,
} from "@/components/wallet";
import {
  FAUCET_USDC_AMOUNT,
  USDC_MINT,
  explorerAddressUrl,
  explorerTxUrl,
} from "@/lib/config";

type Balances = { sol: number; usdc: number };

type RequestState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; signature: string; usdc: number; solSent: number }
  | { kind: "limited"; message: string; retryAfterSeconds: number }
  | { kind: "error"; message: string };

const usdcFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const solFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

function formatWait(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "about a minute" : `${minutes} minutes`;
}

async function fetchBalances(
  connection: Connection,
  owner: PublicKey
): Promise<Balances> {
  const tokenAccount = getAssociatedTokenAddressSync(USDC_MINT, owner);
  const [lamports, tokenInfo] = await Promise.all([
    connection.getBalance(owner, "confirmed"),
    connection.getAccountInfo(tokenAccount, "confirmed"),
  ]);
  let usdc = 0;
  if (tokenInfo) {
    // The token account exists only after the first faucet request.
    const balance = await connection.getTokenAccountBalance(
      tokenAccount,
      "confirmed"
    );
    usdc = Number(balance.value.uiAmountString ?? "0");
  }
  return { sol: lamports / LAMPORTS_PER_SOL, usdc };
}

export function FaucetPanel() {
  const { publicKey } = useWallet();

  if (!publicKey) {
    return (
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="max-w-[48ch] leading-relaxed text-muted-foreground">
          Connect your wallet to see your devnet balances and request test
          USDC.
        </p>
        <ConnectWalletButton className="h-11 w-fit px-5 text-[0.95rem]" />
      </div>
    );
  }

  // Keyed by address so switching wallets starts from a clean state.
  return <ConnectedFaucet key={publicKey.toBase58()} owner={publicKey} />;
}

function ConnectedFaucet({ owner }: { owner: PublicKey }) {
  const { connection } = useConnection();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [balanceError, setBalanceError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState<RequestState>({ kind: "idle" });

  // Initial load for this wallet.
  useEffect(() => {
    let cancelled = false;
    fetchBalances(connection, owner)
      .then((result) => !cancelled && setBalances(result))
      .catch(() => !cancelled && setBalanceError(true));
    return () => {
      cancelled = true;
    };
  }, [connection, owner]);

  const refreshBalances = useCallback(async () => {
    setRefreshing(true);
    setBalanceError(false);
    try {
      setBalances(await fetchBalances(connection, owner));
    } catch {
      setBalanceError(true);
    } finally {
      setRefreshing(false);
    }
  }, [connection, owner]);

  const loadingBalances = refreshing || (balances === null && !balanceError);

  async function requestFunds() {
    setRequest({ kind: "sending" });
    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: owner.toBase58() }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setRequest({ kind: "success", ...data });
        await refreshBalances();
      } else if (response.status === 429) {
        setRequest({
          kind: "limited",
          message: data.error ?? "Please wait before requesting again.",
          retryAfterSeconds: data.retryAfterSeconds ?? 3600,
        });
      } else {
        setRequest({
          kind: "error",
          message: data.error ?? "The faucet request failed. Please try again.",
        });
      }
    } catch {
      setRequest({
        kind: "error",
        message: "Could not reach the faucet. Check your connection and try again.",
      });
    }
  }

  const sending = request.kind === "sending";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[0_12px_32px_-24px_rgb(11_21_18/0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 sm:px-8 sm:pt-7">
        <ConnectedWallet />
        <button
          type="button"
          onClick={() => void refreshBalances()}
          disabled={loadingBalances}
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
        >
          <RefreshCw
            className={`size-3.5 text-teal ${loadingBalances ? "animate-spin" : ""}`}
            aria-hidden
          />
          Refresh
        </button>
      </div>

      <dl
        className="mx-6 mt-6 grid grid-cols-2 divide-x divide-teal/25 border-y border-teal/25 sm:mx-8"
        aria-busy={loadingBalances}
      >
        <BalanceCell
          label="Test USDC"
          value={balances ? usdcFormat.format(balances.usdc) : null}
          unit="USDC"
        />
        <BalanceCell
          label="Devnet SOL"
          value={balances ? solFormat.format(balances.sol) : null}
          unit="SOL"
          className="pl-6"
        />
      </dl>
      {balanceError && (
        <p className="mx-6 mt-3 text-sm text-destructive sm:mx-8">
          Could not load balances from devnet. Try Refresh.
        </p>
      )}

      <div className="grid gap-3 px-6 pt-6 pb-6 sm:px-8 sm:pb-8">
        <Button
          size="lg"
          className="h-11 w-full text-[0.95rem] sm:w-fit sm:px-6"
          disabled={sending || request.kind === "limited"}
          onClick={() => void requestFunds()}
        >
          {sending
            ? "Sending test USDC…"
            : `Get ${FAUCET_USDC_AMOUNT.toLocaleString("en-US")} test USDC`}
        </Button>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Once per wallet each hour. If your wallet has less than 0.01 SOL, the
          faucet also sends 0.05 SOL for fees.
        </p>
        <div aria-live="polite">
          <RequestStatus request={request} />
        </div>
      </div>

      <p className="border-t border-border px-6 py-4 text-xs text-muted-foreground sm:px-8">
        Test USDC mint{" "}
        <a
          href={explorerAddressUrl(USDC_MINT.toBase58())}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-info hover:underline"
        >
          {shortAddress(USDC_MINT.toBase58())}
        </a>{" "}
        on Solana devnet. It has no value.
      </p>
    </div>
  );
}

function BalanceCell({
  label,
  value,
  unit,
  className = "",
}: {
  label: string;
  value: string | null;
  unit: string;
  className?: string;
}) {
  return (
    <div className={`grid gap-1 py-5 ${className}`}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-[clamp(1.6rem,4vw,2.1rem)] leading-none font-semibold tracking-tight text-primary tabular-nums">
        {value ?? (
          <span className="inline-block h-[0.9em] w-24 animate-pulse rounded-md bg-muted align-middle" />
        )}
        {value && (
          <span className="ml-1.5 font-sans text-sm font-medium">{unit}</span>
        )}
      </dd>
    </div>
  );
}

function RequestStatus({ request }: { request: RequestState }) {
  switch (request.kind) {
    case "success":
      return (
        <p className="flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2.5 text-sm text-foreground">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="font-medium text-primary tabular-nums">
              +{usdcFormat.format(request.usdc)} USDC
            </span>
            {request.solSent > 0 && (
              <>
                {" "}and{" "}
                <span className="font-medium text-primary tabular-nums">
                  +{request.solSent} SOL
                </span>
              </>
            )}{" "}
            sent.{" "}
            <a
              href={explorerTxUrl(request.signature)}
              target="_blank"
              rel="noreferrer"
              className="text-info underline"
            >
              View transaction
            </a>
          </span>
        </p>
      );
    case "limited":
      return (
        <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-sm text-foreground">
          <Clock className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
          <span>
            {request.message} You can request again in{" "}
            {formatWait(request.retryAfterSeconds)}.
          </span>
        </p>
      );
    case "error":
      return (
        <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-foreground">
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />
          {request.message}
        </p>
      );
    default:
      return null;
  }
}
