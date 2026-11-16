use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::*,
    error::PactVaultError,
    math,
    state::{InvestorPosition, Pool},
};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub investor: Signer<'info>,

    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, Pool>,

    #[account(address = pool.mint @ PactVaultError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    #[account(mut, seeds = [POOL_VAULT_SEED], bump)]
    pub vault: Account<'info, TokenAccount>,

    /// Destination of the withdrawal. Must belong to the investor.
    #[account(
        mut,
        constraint = investor_token_account.mint == pool.mint @ PactVaultError::InvalidMint,
        constraint = investor_token_account.owner == investor.key() @ PactVaultError::InvalidTokenOwner
    )]
    pub investor_token_account: Account<'info, TokenAccount>,

    /// `has_one` rejects anyone but the position's own investor.
    #[account(mut, has_one = investor @ PactVaultError::Unauthorized)]
    pub position: Account<'info, InvestorPosition>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
    require!(shares > 0, PactVaultError::ZeroShares);
    require!(
        shares <= ctx.accounts.position.shares,
        PactVaultError::InsufficientShares
    );

    let pool_value = ctx.accounts.pool.pool_value()?;
    let amount = math::amount_for_shares(shares, ctx.accounts.pool.total_shares, pool_value)?;
    require!(amount > 0, PactVaultError::WithdrawTooSmall);
    require!(
        amount <= ctx.accounts.pool.idle_assets,
        PactVaultError::InsufficientLiquidity
    );

    // Burn the shares before moving tokens out.
    let position = &mut ctx.accounts.position;
    position.shares = position
        .shares
        .checked_sub(shares)
        .ok_or(PactVaultError::MathOverflow)?;
    let pool = &mut ctx.accounts.pool;
    pool.total_shares = pool
        .total_shares
        .checked_sub(shares)
        .ok_or(PactVaultError::MathOverflow)?;
    pool.idle_assets = pool
        .idle_assets
        .checked_sub(amount)
        .ok_or(PactVaultError::MathOverflow)?;

    // The vault is owned by the pool PDA, so the pool "signs" with its seeds.
    let signer_seeds: &[&[&[u8]]] = &[&[POOL_SEED, &[pool.bump]]];
    token::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.investor_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
        ctx.accounts.mint.decimals,
    )?;

    Ok(())
}
