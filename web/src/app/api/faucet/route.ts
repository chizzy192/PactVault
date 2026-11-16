import {
  FaucetError,
  parseWalletAddress,
  requestFromFaucet,
} from "@/lib/faucet.server";

/** Best-effort client IP. Behind a trusted proxy, the first forwarded hop. */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** POST /api/faucet { wallet } -> 1,000 test USDC (+ 0.05 SOL if low). */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new FaucetError("Send JSON like { \"wallet\": \"<address>\" }.", 400);
    }
    const wallet = parseWalletAddress(
      (body as { wallet?: unknown } | null)?.wallet
    );
    const result = await requestFromFaucet(wallet, clientIp(request));
    return Response.json(result);
  } catch (error) {
    if (error instanceof FaucetError) {
      const headers: HeadersInit = error.retryAfterSeconds
        ? { "Retry-After": String(error.retryAfterSeconds) }
        : {};
      return Response.json(
        { error: error.message, retryAfterSeconds: error.retryAfterSeconds },
        { status: error.status, headers }
      );
    }
    console.error("[faucet] unexpected error", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
