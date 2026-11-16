use anchor_lang::prelude::*;

/// Seed for the single Pool PDA.
#[constant]
pub const POOL_SEED: &[u8] = b"pool";

/// Seed for the pool's token vault PDA.
#[constant]
pub const POOL_VAULT_SEED: &[u8] = b"pool_vault";

/// Seed prefix for each investor's position PDA: ["position", investor].
#[constant]
pub const POSITION_SEED: &[u8] = b"position";

/// 100% expressed in basis points.
#[constant]
pub const MAX_BPS: u16 = 10_000;

/// The only wallet allowed to call `init_pool`.
#[constant]
pub const ADMIN_PUBKEY: Pubkey = pubkey!("Gz9TAaKYgLTTsSvr4RwUKCkF6venbiUupUVGv9HESuyq");

/// Decimals the pool mint must have (matches USDC).
#[constant]
pub const MINT_DECIMALS: u8 = 6;
