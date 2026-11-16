use anchor_lang::prelude::*;

use crate::{
    error::PactVaultError,
    state::{Escrow, EscrowStatus},
};

#[derive(Accounts)]
pub struct SubmitWork<'info> {
    pub freelancer: Signer<'info>,

    #[account(mut, has_one = freelancer @ PactVaultError::NotFreelancer)]
    pub escrow: Account<'info, Escrow>,
}

pub fn handle_submit_work(ctx: Context<SubmitWork>, proof_hash: [u8; 32]) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(
        escrow.status == EscrowStatus::Active,
        PactVaultError::InvalidEscrowStatus
    );

    escrow.proof_hash = proof_hash;
    // The client's review window starts now.
    escrow.submitted_at = Clock::get()?.unix_timestamp;
    escrow.status = EscrowStatus::Submitted;
    Ok(())
}
