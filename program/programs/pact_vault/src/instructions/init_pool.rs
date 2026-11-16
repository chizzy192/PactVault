use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{constants::*, error::PactVaultError, state::Pool};

#[derive(Accounts)]
pub struct InitPool<'info> {
    /// Only the hard-coded admin wallet may create the pool.
    #[account(mut, address = ADMIN_PUBKEY @ PactVaultError::Unauthorized)]
    pub admin: Signer<'info>,

    /// `init` fails if the pool already exists, so this can only run once.
    #[account(
        init,
        payer = admin,
        space = 8 + Pool::INIT_SPACE,
        seeds = [POOL_SEED],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(constraint = mint.decimals == MINT_DECIMALS @ PactVaultError::InvalidMintDecimals)]
    pub mint: Account<'info, Mint>,

    /// Holds every deposited token. Owned by the pool PDA, so only this
    /// program can move tokens out of it.
    #[account(
        init,
        payer = admin,
        seeds = [POOL_VAULT_SEED],
        bump,
        token::mint = mint,
        token::authority = pool,
        token::token_program = token_program
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_init_pool(ctx: Context<InitPool>, advance_bps: u16, fee_bps: u16) -> Result<()> {
    require!(advance_bps <= MAX_BPS, PactVaultError::InvalidBps);
    require!(fee_bps <= MAX_BPS, PactVaultError::InvalidBps);
    // Settlement pays the pool advance + fee out of the locked amount, so the
    // two rates together must not exceed 100% or settle could never succeed.
    require!(
        advance_bps as u32 + fee_bps as u32 <= MAX_BPS as u32,
        PactVaultError::InvalidBpsSum
    );

    ctx.accounts.pool.set_inner(Pool {
        admin: ctx.accounts.admin.key(),
        mint: ctx.accounts.mint.key(),
        total_shares: 0,
        idle_assets: 0,
        outstanding_advances: 0,
        advance_bps,
        fee_bps,
        bump: ctx.bumps.pool,
    });
    Ok(())
}
