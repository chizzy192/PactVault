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
