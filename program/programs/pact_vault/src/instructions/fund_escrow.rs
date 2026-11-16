use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::*,
    error::PactVaultError,
    state::{Escrow, EscrowStatus},
};

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    pub client: Signer<'info>,

    #[account(
        mut,
        has_one = client @ PactVaultError::NotClient,
        has_one = mint @ PactVaultError::InvalidMint
    )]
    pub escrow: Account<'info, Escrow>,

    pub mint: Account<'info, Mint>,

    #[account(mut, seeds = [ESCROW_VAULT_SEED, escrow.key().as_ref()], bump)]
    pub escrow_vault: Account<'info, TokenAccount>,

    /// Source of the funds. The token program checks that `client` may
    /// move these tokens.
    #[account(
        mut,
        constraint = client_token_account.mint == escrow.mint @ PactVaultError::InvalidMint
    )]
    pub client_token_account: Account<'info, TokenAccount>,

    /// Receives the upfront payment.
    #[account(
        mut,
        constraint = freelancer_token_account.owner == escrow.freelancer
            @ PactVaultError::InvalidFreelancerTokenAccount,
        constraint = freelancer_token_account.mint == escrow.mint @ PactVaultError::InvalidMint
    )]
    pub freelancer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;
    require!(
        escrow.status == EscrowStatus::Signed,
        PactVaultError::InvalidEscrowStatus
    );

    let total_amount = escrow.total_amount;
    let upfront = escrow.upfront_amount()?;
    let decimals = ctx.accounts.mint.decimals;

    // 1. Client -> escrow vault: the full amount.
    token::transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.client_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.escrow_vault.to_account_info(),
                authority: ctx.accounts.client.to_account_info(),
            },
        ),
        total_amount,
        decimals,
    )?;

    // 2. Escrow vault -> freelancer: the upfront part. The escrow PDA signs.
    if upfront > 0 {
        let client_key = escrow.client;
        let id_bytes = escrow.escrow_id.to_le_bytes();
        let bump = [escrow.bump];
        let signer_seeds: &[&[&[u8]]] = &[&[ESCROW_SEED, client_key.as_ref(), &id_bytes, &bump]];
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.freelancer_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer_seeds,
            ),
            upfront,
            decimals,
        )?;
    }

    ctx.accounts.escrow.status = EscrowStatus::Active;
    Ok(())
}
