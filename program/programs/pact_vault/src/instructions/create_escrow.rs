use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{
    constants::*,
    error::PactVaultError,
    state::{Escrow, EscrowStatus, Pool},
};

#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct CreateEscrow<'info> {
    /// The client or the freelancer. Pays rent for the escrow and its vault.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: only the address is stored; it must sign later actions itself.
    pub client: UncheckedAccount<'info>,

    /// CHECK: only the address is stored; it must sign later actions itself.
    pub freelancer: UncheckedAccount<'info>,

    /// CHECK: only the address is stored; not used until disputes exist.
    pub resolver: UncheckedAccount<'info>,

    #[account(seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, Pool>,

    /// Escrows use the same token as the pool, so advances can be repaid.
    #[account(address = pool.mint @ PactVaultError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [ESCROW_SEED, client.key().as_ref(), &escrow_id.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    /// Holds the locked part of the escrow. Owned by the escrow PDA.
    #[account(
        init,
        payer = creator,
        seeds = [ESCROW_VAULT_SEED, escrow.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = escrow,
        token::token_program = token_program
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[allow(clippy::too_many_arguments)]
pub fn handle_create_escrow(
    ctx: Context<CreateEscrow>,
    escrow_id: u64,
    total_amount: u64,
    upfront_bps: u16,
    contract_hash: [u8; 32],
    deadline: i64,
    review_window_secs: i64,
) -> Result<()> {
    let creator = ctx.accounts.creator.key();
    let client = ctx.accounts.client.key();
    let freelancer = ctx.accounts.freelancer.key();
    let resolver = ctx.accounts.resolver.key();

    require!(
        creator == client || creator == freelancer,
        PactVaultError::NotParty
    );
    require!(total_amount > 0, PactVaultError::ZeroAmount);
    require!(
        upfront_bps <= MAX_UPFRONT_BPS,
        PactVaultError::InvalidUpfrontBps
    );
    require!(client != freelancer, PactVaultError::SameParty);
    require!(
        resolver != client && resolver != freelancer,
        PactVaultError::InvalidResolver
    );
    require!(
        (MIN_REVIEW_WINDOW_SECS..=MAX_REVIEW_WINDOW_SECS).contains(&review_window_secs),
        PactVaultError::InvalidReviewWindow
    );
    require!(
        deadline > Clock::get()?.unix_timestamp,
        PactVaultError::InvalidDeadline
    );

    ctx.accounts.escrow.set_inner(Escrow {
        escrow_id,
        client,
        freelancer,
        resolver,
        mint: ctx.accounts.mint.key(),
        total_amount,
        upfront_bps,
        contract_hash,
        client_signed: false,
        freelancer_signed: false,
        status: EscrowStatus::Draft,
        deadline,
        review_window_secs,
        submitted_at: 0,
        proof_hash: [0; 32],
        advance_amount: 0,
        bump: ctx.bumps.escrow,
    });
    Ok(())
}
