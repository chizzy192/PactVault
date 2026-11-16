# PactVault

A Solana devnet MVP.

- **Stage 1:** an investor pool where investors deposit a 6-decimal USDC
  stand-in and receive shares, and withdraw by burning shares.
- **Stage 2:** client/freelancer escrows. After submitting work, a freelancer
  can take an advance from the pool; it is repaid, with a fee, when the
  escrow settles.

## Program

| | |
|---|---|
| Program ID | `DQGA85XVQcpYtrUoTdiKowiekXPF7WcesLPLYB8XKbuh` |
| Admin (only signer allowed to call `init_pool`) | `Gz9TAaKYgLTTsSvr4RwUKCkF6venbiUupUVGv9HESuyq` |
| Pool mint | Must have 6 decimals |

## Accounting

The pool keeps its own ledger and never reads the vault's live token balance
for pricing:

- `deposit` adds the amount to `pool.idle_assets`; `withdraw` subtracts it.
- `pool_value = idle_assets + outstanding_advances`.
- A withdrawal fails with `InsufficientLiquidity` if it needs more than
  `idle_assets`.

Tokens sent straight to the vault (not through `deposit`) are not counted, so
they cannot move the share price.

## Escrow (stage 2)

```
create_escrow -> Draft --sign_contract x2--> Signed --fund_escrow--> Active
  --submit_work--> Submitted --approve / auto_release--> Completed
                       |
                       +-- take_advance (optional, once)
```

| Instruction | Who signs | What it does |
|---|---|---|
| `create_escrow` | client or freelancer | Creates the escrow and its token vault (Draft) |
| `sign_contract` | client, freelancer | Each confirms the contract hash; both -> Signed |
| `fund_escrow` | client | Full amount into the escrow vault; upfront part to the freelancer |
| `submit_work` | freelancer | Stores the proof hash; the review window starts |
| `take_advance` | freelancer | Pool lends `locked * advance_bps / 10000` to the freelancer |
| `approve` | client | Settles |
| `auto_release` | anyone, after the review window | Settles |

Amounts, with `locked = total - total * upfront_bps / 10000`:

- `fee = locked * fee_bps / 10000` (charged on every settlement)
- Settlement: `advance + fee` to the pool, the rest of `locked` to the
  freelancer.
- `take_advance` moves the advance from `idle_assets` to
  `outstanding_advances`; settlement moves it back to `idle_assets` along
  with the fee. Investors earn the fee.

`init_pool` requires `advance_bps + fee_bps <= 10000` so the pool's share can
never exceed the locked amount.

## Layout

| Path | What it is |
|---|---|
| `program/` | Anchor workspace (Rust program + TypeScript tests) |
| `program/programs/pact_vault/src/` | The on-chain program |
| `program/tests/` | Integration tests run by `anchor test` |
| `web/` | Front end (empty until a later stage) |

Inside `src/`: `lib.rs` lists the instructions, `instructions/` holds one file
per instruction, `state.rs` the account layouts, `math.rs` the share math,
`error.rs` the error codes and `constants.rs` the PDA seeds, admin key and
required mint decimals.

## Requirements

Tested with Anchor 1.2.2, Solana CLI 4.1.2, Rust 1.89+, Node 20+ and Yarn 1.
On Windows, use WSL (Ubuntu).

## Run the tests

```bash
cd program
yarn install                      # first time only
cargo test -p pact_vault --lib    # share-math unit tests
anchor test --validator legacy    # build, start a local validator, run tests
```

The tests sign `init_pool` with the wallet in `Anchor.toml`
(`~/.config/solana/id.json`), so that wallet must be the admin key above.

`tests/pact_vault.ts` runs before `tests/escrow.ts` (the order is set in
`Anchor.toml`), because both share the single pool. The auto-release test
waits about a minute for the 60-second review window to pass on the chain's
clock, so a full run takes about 2 minutes.

`--validator legacy` uses `solana-test-validator`. Drop the flag if you have
Surfpool (Anchor's default local validator) installed.

## License

MIT
