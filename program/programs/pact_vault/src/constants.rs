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

/// Seed prefix for each escrow PDA: ["escrow", client, escrow_id as u64 LE].
#[constant]
pub const ESCROW_SEED: &[u8] = b"escrow";

/// Seed prefix for each escrow's token vault PDA: ["escrow_vault", escrow].
#[constant]
pub const ESCROW_VAULT_SEED: &[u8] = b"escrow_vault";

/// Highest share of an escrow that may be paid upfront (50%).
#[constant]
pub const MAX_UPFRONT_BPS: u16 = 5_000;

/// Shortest allowed client review window (1 minute).
#[constant]
pub const MIN_REVIEW_WINDOW_SECS: i64 = 60;

/// Longest allowed client review window (7 days).
#[constant]
pub const MAX_REVIEW_WINDOW_SECS: i64 = 604_800;
