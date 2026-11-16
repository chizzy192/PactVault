use anchor_lang::prelude::*;

use crate::{
    error::PactVaultError,
    state::{Escrow, EscrowStatus},
};

#[derive(Accounts)]
pub struct SignContract<'info> {
    /// The client or the freelancer.
    pub party: Signer<'info>,

    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
}

pub fn handle_sign_contract(ctx: Context<SignContract>, contract_hash: [u8; 32]) -> Result<()> {
    let party = ctx.accounts.party.key();
    let escrow = &mut ctx.accounts.escrow;

    require!(
        party == escrow.client || party == escrow.freelancer,
        PactVaultError::NotParty
    );
    require!(
        escrow.status == EscrowStatus::Draft,
        PactVaultError::InvalidEscrowStatus
    );
    require!(
        contract_hash == escrow.contract_hash,
        PactVaultError::ContractHashMismatch
    );

    if party == escrow.client {
        require!(!escrow.client_signed, PactVaultError::AlreadySigned);
        escrow.client_signed = true;
    } else {
        require!(!escrow.freelancer_signed, PactVaultError::AlreadySigned);
        escrow.freelancer_signed = true;
    }

    if escrow.client_signed && escrow.freelancer_signed {
        escrow.status = EscrowStatus::Signed;
    }
    Ok(())
}
