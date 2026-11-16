use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::*,
    error::PactVaultError,
    math,
    state::{InvestorPosition, Pool},
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, Pool>,

    #[account(address = pool.mint @ PactVaultError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    #[account(mut, seeds = [POOL_VAULT_SEED], bump)]
    pub vault: Account<'info, TokenAccount>,

    /// Source of the deposit. The token program checks that `investor`
    /// is allowed to move these tokens.
    #[account(
        mut,
        constraint = investor_token_account.mint == pool.mint @ PactVaultError::InvalidMint
    )]
    pub investor_token_account: Account<'info, TokenAccount>,

    /// Created on the investor's first deposit, reused afterwards.
    #[account(
        init_if_needed,
        payer = investor,
        space = 8 + InvestorPosition::INIT_SPACE,
        seeds = [POSITION_SEED, investor.key().as_ref()],
        bump
    )]
    pub position: Account<'info, InvestorPosition>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, PactVaultError::ZeroAmount);

    // Price the deposit against the pool *before* the new tokens arrive.
    let pool_value = ctx.accounts.pool.pool_value()?;
    let shares = math::shares_for_deposit(amount, ctx.accounts.pool.total_shares, pool_value)?;
    require!(shares > 0, PactVaultError::DepositTooSmall);

    token::transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.investor_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.investor.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.mint.decimals,
    )?;

    let pool = &mut ctx.accounts.pool;
    pool.total_shares = pool
        .total_shares
        .checked_add(shares)
        .ok_or(PactVaultError::MathOverflow)?;
    pool.idle_assets = pool
        .idle_assets
        .checked_add(amount)
        .ok_or(PactVaultError::MathOverflow)?;

    let position = &mut ctx.accounts.position;
    if position.investor == Pubkey::default() {
        position.investor = ctx.accounts.investor.key();
        position.bump = ctx.bumps.position;
    }
    position.shares = position
        .shares
        .checked_add(shares)
        .ok_or(PactVaultError::MathOverflow)?;

    Ok(())
}
