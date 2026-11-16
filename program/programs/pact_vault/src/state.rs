use anchor_lang::prelude::*;

use crate::error::PactVaultError;

/// Global pool state. PDA with seeds ["pool"].
#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub admin: Pubkey,
    /// The only token this pool accepts (a 6-decimal USDC stand-in).
    pub mint: Pubkey,
    /// Sum of every investor's shares.
    pub total_shares: u64,
    /// Tokens the pool holds and can pay out, as tracked by this program.
    /// Only `deposit` and `withdraw` (and later stages' own instructions)
    /// change it. Tokens sent straight to the vault are NOT counted, so the
    /// live vault balance is never used in any math.
    pub idle_assets: u64,
    /// Tokens lent out and not yet repaid. Always 0 until stage 2.
    pub outstanding_advances: u64,
    pub advance_bps: u16,
    pub fee_bps: u16,
    pub bump: u8,
}

impl Pool {
    /// Total value owned by investors: idle tokens plus tokens lent out.
    pub fn pool_value(&self) -> Result<u64> {
        self.idle_assets
            .checked_add(self.outstanding_advances)
            .ok_or_else(|| error!(PactVaultError::MathOverflow))
    }
}

/// One investor's share balance. PDA with seeds ["position", investor].
#[account]
#[derive(InitSpace)]
pub struct InvestorPosition {
    pub investor: Pubkey,
    pub shares: u64,
    pub bump: u8,
}
