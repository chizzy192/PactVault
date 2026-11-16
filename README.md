# PactVault

A Solana devnet MVP. **Stage 1:** an investor pool where investors deposit a
6-decimal USDC stand-in and receive shares, and withdraw by burning shares.

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

`--validator legacy` uses `solana-test-validator`. Drop the flag if you have
Surfpool (Anchor's default local validator) installed.

## License

MIT
