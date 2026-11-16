//! `approve` and `auto_release` share these accounts and the `settle`
//! function. They differ only in who may call them and when.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::*,
    error::PactVaultError,
    math,
    state::{Escrow, EscrowStatus, Pool},
};

#[derive(Accounts)]
pub struct Settle<'info> {
    /// `approve`: must be the client. `auto_release`: anyone.
    pub caller: Signer<'info>,

    #[account(mut, has_one = mint @ PactVaultError::InvalidMint)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut, seeds = [ESCROW_VAULT_SEED, escrow.key().as_ref()], bump)]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, Pool>,

    #[account(mut, seeds = [POOL_VAULT_SEED], bump)]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(address = pool.mint @ PactVaultError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    /// Receives the rest of the locked tokens. Checked against the escrow
    /// because `auto_release` can be called by anyone.
    #[account(
        mut,
        constraint = freelancer_token_account.owner == escrow.freelancer
            @ PactVaultError::InvalidFreelancerTokenAccount,
        constraint = freelancer_token_account.mint == escrow.mint @ PactVaultError::InvalidMint
    )]
    pub freelancer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// The client accepts the work.
pub fn handle_approve(ctx: Context<Settle>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;
    require!(
        ctx.accounts.caller.key() == escrow.client,
        PactVaultError::NotClient
    );
    require!(
        escrow.status == EscrowStatus::Submitted,
        PactVaultError::InvalidEscrowStatus
    );
    settle(ctx.accounts)
}

/// Anyone may release the escrow once the client's review window is over.
pub fn handle_auto_release(ctx: Context<Settle>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;
    require!(
        escrow.status == EscrowStatus::Submitted,
        PactVaultError::InvalidEscrowStatus
    );
    let release_at = escrow
        .submitted_at
        .checked_add(escrow.review_window_secs)
        .ok_or(PactVaultError::MathOverflow)?;
    require!(
        Clock::get()?.unix_timestamp >= release_at,
        PactVaultError::ReviewWindowOpen
    );
    settle(ctx.accounts)
}

/// Pays the pool back (advance + fee) and the freelancer the rest of the
/// locked tokens, then marks the escrow Completed.
fn settle(accounts: &mut Settle<'_>) -> Result<()> {
    let locked = accounts.escrow.locked_amount()?;
    let advance_amount = accounts.escrow.advance_amount;
    let split = math::settlement(locked, advance_amount, accounts.pool.fee_bps)?;

    // Update the books before moving tokens.
    let pool = &mut accounts.pool;
    pool.idle_assets = pool
        .idle_assets
        .checked_add(split.to_pool)
        .ok_or(PactVaultError::MathOverflow)?;
    pool.outstanding_advances = pool
        .outstanding_advances
        .checked_sub(advance_amount)
        .ok_or(PactVaultError::MathOverflow)?;
    accounts.escrow.status = EscrowStatus::Completed;

    // Both transfers leave the escrow vault, so the escrow PDA signs.
    let client_key = accounts.escrow.client;
    let id_bytes = accounts.escrow.escrow_id.to_le_bytes();
    let bump = [accounts.escrow.bump];
    let signer_seeds: &[&[&[u8]]] = &[&[ESCROW_SEED, client_key.as_ref(), &id_bytes, &bump]];

    let to_pool_vault = accounts.pool_vault.to_account_info();
    pay_from_escrow_vault(accounts, to_pool_vault, split.to_pool, signer_seeds)?;
    let to_freelancer = accounts.freelancer_token_account.to_account_info();
    pay_from_escrow_vault(accounts, to_freelancer, split.to_freelancer, signer_seeds)?;

    Ok(())
}

/// Moves `amount` from the escrow vault to `to`, signed by the escrow PDA.
fn pay_from_escrow_vault<'info>(
    accounts: &Settle<'info>,
    to: AccountInfo<'info>,
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    token::transfer_checked(
        CpiContext::new_with_signer(
            accounts.token_program.key(),
            TransferChecked {
                from: accounts.escrow_vault.to_account_info(),
                mint: accounts.mint.to_account_info(),
                to,
                authority: accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
        accounts.mint.decimals,
    )
}
