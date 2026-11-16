use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::*,
    error::PactVaultError,
    math,
    state::{Escrow, EscrowStatus, Pool},
};

#[derive(Accounts)]
pub struct TakeAdvance<'info> {
    pub freelancer: Signer<'info>,

    #[account(
        mut,
        has_one = freelancer @ PactVaultError::NotFreelancer,
        has_one = mint @ PactVaultError::InvalidMint
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, Pool>,

    #[account(address = pool.mint @ PactVaultError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    #[account(mut, seeds = [POOL_VAULT_SEED], bump)]
    pub pool_vault: Account<'info, TokenAccount>,

    /// Receives the advance.
    #[account(
        mut,
        constraint = freelancer_token_account.owner == freelancer.key()
            @ PactVaultError::InvalidFreelancerTokenAccount,
        constraint = freelancer_token_account.mint == escrow.mint @ PactVaultError::InvalidMint
    )]
    pub freelancer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_take_advance(ctx: Context<TakeAdvance>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;
    require!(
        escrow.status == EscrowStatus::Submitted,
        PactVaultError::InvalidEscrowStatus
    );
    require!(
        escrow.advance_amount == 0,
        PactVaultError::AdvanceAlreadyTaken
    );

    let locked = escrow.locked_amount()?;
    let advance = math::bps_of(locked, ctx.accounts.pool.advance_bps)?;
    require!(advance > 0, PactVaultError::ZeroAdvance);
    // Only the pool's own books count, never the live vault balance.
    require!(
        advance <= ctx.accounts.pool.idle_assets,
        PactVaultError::InsufficientLiquidity
    );

    // Update the books before moving tokens. Idle tokens become an
    // outstanding advance, so pool_value does not change.
    ctx.accounts.escrow.advance_amount = advance;
    let pool = &mut ctx.accounts.pool;
    pool.idle_assets = pool
        .idle_assets
        .checked_sub(advance)
        .ok_or(PactVaultError::MathOverflow)?;
    pool.outstanding_advances = pool
        .outstanding_advances
        .checked_add(advance)
        .ok_or(PactVaultError::MathOverflow)?;

    // Pool vault -> freelancer. The pool PDA signs.
    let signer_seeds: &[&[&[u8]]] = &[&[POOL_SEED, &[pool.bump]]];
    token::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.pool_vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.freelancer_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        advance,
        ctx.accounts.mint.decimals,
    )?;

    Ok(())
}
