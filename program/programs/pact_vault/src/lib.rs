pub mod constants;
pub mod error;
pub mod instructions;
pub mod math;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("DQGA85XVQcpYtrUoTdiKowiekXPF7WcesLPLYB8XKbuh");

#[program]
pub mod pact_vault {
    use super::*;

    /// Creates the pool and its token vault. Can only succeed once.
    pub fn init_pool(ctx: Context<InitPool>, advance_bps: u16, fee_bps: u16) -> Result<()> {
        crate::instructions::init_pool::handle_init_pool(ctx, advance_bps, fee_bps)
    }

    /// Moves `amount` tokens into the vault and mints shares to the investor.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        crate::instructions::deposit::handle_deposit(ctx, amount)
    }

    /// Burns `shares` and sends the matching tokens back to the investor.
    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
        crate::instructions::withdraw::handle_withdraw(ctx, shares)
    }

    // ---------- stage 2: escrow and advance ----------

    /// Client or freelancer creates a Draft escrow and its token vault.
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        escrow_id: u64,
        total_amount: u64,
        upfront_bps: u16,
        contract_hash: [u8; 32],
        deadline: i64,
        review_window_secs: i64,
    ) -> Result<()> {
        crate::instructions::create_escrow::handle_create_escrow(
            ctx,
            escrow_id,
            total_amount,
            upfront_bps,
            contract_hash,
            deadline,
            review_window_secs,
        )
    }

    /// Client or freelancer confirms the contract hash. Both -> Signed.
    pub fn sign_contract(ctx: Context<SignContract>, contract_hash: [u8; 32]) -> Result<()> {
        crate::instructions::sign_contract::handle_sign_contract(ctx, contract_hash)
    }

    /// Client deposits the full amount; the upfront part goes to the freelancer.
    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        crate::instructions::fund_escrow::handle_fund_escrow(ctx)
    }

    /// Freelancer records proof of work and starts the review window.
    pub fn submit_work(ctx: Context<SubmitWork>, proof_hash: [u8; 32]) -> Result<()> {
        crate::instructions::submit_work::handle_submit_work(ctx, proof_hash)
    }

    /// Freelancer borrows part of the locked amount from the pool, once.
    pub fn take_advance(ctx: Context<TakeAdvance>) -> Result<()> {
        crate::instructions::take_advance::handle_take_advance(ctx)
    }

    /// Client accepts the work; the escrow settles.
    pub fn approve(ctx: Context<Settle>) -> Result<()> {
        crate::instructions::settle::handle_approve(ctx)
    }

    /// Anyone settles the escrow after the review window has passed.
    pub fn auto_release(ctx: Context<Settle>) -> Result<()> {
        crate::instructions::settle::handle_auto_release(ctx)
    }
}
