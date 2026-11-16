# PactVault

A Solana devnet MVP. **Stage 1:** an investor pool where investors deposit a
6-decimal USDC stand-in and receive shares, and withdraw by burning shares.

## Layout

| Path | What it is |
|---|---|
| `program/` | Anchor workspace (Rust program + TypeScript tests) |
| `program/programs/pact_vault/src/` | The on-chain program |
| `program/tests/` | Integration tests run by `anchor test` |
| `web/` | Front end (empty until a later stage) |

Inside `src/`: `lib.rs` lists the instructions, `instructions/` holds one file
per instruction, `state.rs` the account layouts, `math.rs` the share math,
`error.rs` the error codes and `constants.rs` the PDA seeds.

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

`--validator legacy` uses `solana-test-validator`. Drop the flag if you have
Surfpool (Anchor's default local validator) installed.

## License

MIT
