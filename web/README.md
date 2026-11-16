# PactVault web app

The PactVault front end on **Solana devnet**: a home page that explains the
pact (sign, lock, get paid) with a Phantom connect button, and a faucet that
gives any wallet 1,000 test USDC (plus 0.05 SOL if it has less than 0.01 SOL).

Next.js 16 (App Router), TypeScript, Tailwind 4, shadcn/ui, Solana wallet
adapter. Devnet only.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

Open it in a browser with Phantom installed. Other scripts: `npm run build`,
`npm run lint`, `npm run typecheck`, and `npm run sync-idl` (copies the
program IDL and types from `../program/target` after `anchor build`).

## Environment variables

Set these in `.env.local` (git-ignored). `.env.example` lists them.

| Variable | Where it is used | Value |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Browser and server | A Solana **devnet** RPC URL. Optional; defaults to `https://api.devnet.solana.com`. Non-devnet URLs are rejected. |
| `NEXT_PUBLIC_USDC_MINT` | Browser and server | The test USDC mint address (see the root README's Devnet section). |
| `FAUCET_SECRET_KEY` | **Server only** | The faucet keypair as a JSON array of 64 numbers (the test USDC mint authority). Never prefix it with `NEXT_PUBLIC_`; it must not reach the browser. |

The admin wallet and the program keypair are never used by the web app.

## Faucet API

`POST /api/faucet` with `{ "wallet": "<address>" }`. Limits: one request per
wallet per hour and five per IP per hour (kept in server memory, so they reset
on restart).
