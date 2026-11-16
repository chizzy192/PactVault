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
}
