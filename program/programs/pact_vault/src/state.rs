use anchor_lang::prelude::*;

use crate::{error::PactVaultError, math};

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

/// Where an escrow is in its life. Disputed and Cancelled are not used yet.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Draft,
    Signed,
    Active,
    Submitted,
    Disputed,
    Completed,
    Cancelled,
}

/// One client/freelancer contract.
/// PDA with seeds ["escrow", client, escrow_id as u64 little-endian].
#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub escrow_id: u64,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub resolver: Pubkey,
    pub mint: Pubkey,
    pub total_amount: u64,
    pub upfront_bps: u16,
    pub contract_hash: [u8; 32],
    pub client_signed: bool,
    pub freelancer_signed: bool,
    pub status: EscrowStatus,
    /// Unix time. Must be in the future at creation; no rule uses it yet.
    pub deadline: i64,
    pub review_window_secs: i64,
    /// Unix time of `submit_work`; 0 until then.
    pub submitted_at: i64,
    pub proof_hash: [u8; 32],
    /// Tokens advanced from the pool; 0 if no advance was taken.
    pub advance_amount: u64,
    pub bump: u8,
}

impl Escrow {
    /// Tokens paid to the freelancer when the escrow is funded.
    pub fn upfront_amount(&self) -> Result<u64> {
        math::bps_of(self.total_amount, self.upfront_bps)
    }

    /// Tokens held in the escrow vault after the upfront payment.
    pub fn locked_amount(&self) -> Result<u64> {
        math::locked_amount(self.total_amount, self.upfront_bps)
    }
}
