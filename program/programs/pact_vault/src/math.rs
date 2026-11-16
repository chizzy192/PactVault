//! Share and escrow math, kept free of accounts so it can be unit tested on
//! its own.
//!
//! Every division rounds down. For shares that means rounding favours the
//! pool. For escrows, upfront, advance and fee all round down, and whatever
//! rounding leaves over goes to the freelancer at settlement.

use anchor_lang::prelude::*;

use crate::{constants::MAX_BPS, error::PactVaultError};

/// `amount * bps / 10000`, rounded down.
pub fn bps_of(amount: u64, bps: u16) -> Result<u64> {
    mul_div(amount, bps as u64, MAX_BPS as u64)
}

/// What stays in the escrow vault after the upfront payment.
pub fn locked_amount(total_amount: u64, upfront_bps: u16) -> Result<u64> {
    total_amount
        .checked_sub(bps_of(total_amount, upfront_bps)?)
        .ok_or_else(|| error!(PactVaultError::MathOverflow))
}

/// How the locked tokens are split when an escrow settles.
#[derive(Debug, PartialEq, Eq)]
pub struct Settlement {
    pub fee: u64,
    /// Advance repaid plus fee; goes back to the pool.
    pub to_pool: u64,
    /// Everything else; goes to the freelancer.
    pub to_freelancer: u64,
}

/// Splits `locked` between the pool and the freelancer.
///
/// Cannot underflow while `advance_bps + fee_bps <= 10000`, which
/// `init_pool` enforces.
pub fn settlement(locked: u64, advance_amount: u64, fee_bps: u16) -> Result<Settlement> {
    let fee = bps_of(locked, fee_bps)?;
    let to_pool = advance_amount
        .checked_add(fee)
        .ok_or_else(|| error!(PactVaultError::MathOverflow))?;
    let to_freelancer = locked
        .checked_sub(to_pool)
        .ok_or_else(|| error!(PactVaultError::MathOverflow))?;
    Ok(Settlement {
        fee,
        to_pool,
        to_freelancer,
    })
}

/// Shares to mint for a deposit of `amount` tokens.
pub fn shares_for_deposit(amount: u64, total_shares: u64, pool_value: u64) -> Result<u64> {
    if total_shares == 0 {
        return Ok(amount);
    }
    mul_div(amount, total_shares, pool_value)
}

/// Tokens to pay out for burning `shares`.
pub fn amount_for_shares(shares: u64, total_shares: u64, pool_value: u64) -> Result<u64> {
    mul_div(shares, pool_value, total_shares)
}

/// `a * b / c` computed in u128 so the multiplication cannot overflow.
fn mul_div(a: u64, b: u64, c: u64) -> Result<u64> {
    let result = (a as u128)
        .checked_mul(b as u128)
        .and_then(|product| product.checked_div(c as u128))
        .ok_or_else(|| error!(PactVaultError::MathOverflow))?;
    u64::try_from(result).map_err(|_| error!(PactVaultError::MathOverflow))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn first_deposit_mints_one_share_per_token() {
        assert_eq!(shares_for_deposit(500, 0, 0).unwrap(), 500);
    }

    #[test]
    fn later_deposit_is_proportional_to_pool_value() {
        // Pool worth 1000 with 500 shares: each share is worth 2 tokens.
        assert_eq!(shares_for_deposit(250, 500, 1_000).unwrap(), 125);
    }

    #[test]
    fn deposit_rounds_down() {
        // 1 * 3 / 2 = 1.5 -> 1
        assert_eq!(shares_for_deposit(1, 3, 2).unwrap(), 1);
        // 1 * 1 / 2 = 0.5 -> 0, which the deposit instruction rejects.
        assert_eq!(shares_for_deposit(1, 1, 2).unwrap(), 0);
    }

    #[test]
    fn withdraw_is_proportional_to_pool_value() {
        assert_eq!(amount_for_shares(200, 750, 750).unwrap(), 200);
        assert_eq!(amount_for_shares(100, 500, 1_000).unwrap(), 200);
    }

    #[test]
    fn withdraw_rounds_down() {
        // 1 * 2 / 3 = 0.67 -> 0
        assert_eq!(amount_for_shares(1, 3, 2).unwrap(), 0);
    }

    #[test]
    fn large_values_do_not_overflow_the_multiplication() {
        assert_eq!(
            shares_for_deposit(u64::MAX, u64::MAX, u64::MAX).unwrap(),
            u64::MAX
        );
    }

    #[test]
    fn result_too_large_for_u64_is_an_error() {
        assert!(shares_for_deposit(u64::MAX, u64::MAX, 1).is_err());
    }

    #[test]
    fn zero_pool_value_with_existing_shares_is_an_error() {
        assert!(shares_for_deposit(100, 500, 0).is_err());
    }

    #[test]
    fn zero_total_shares_on_withdraw_is_an_error() {
        assert!(amount_for_shares(100, 0, 0).is_err());
    }

    // ---------- escrow math (6 decimals: 1 token = 1_000_000) ----------

    const T: u64 = 1_000_000;

    #[test]
    fn spec_a_no_advance_200_at_50_percent() {
        let locked = locked_amount(200 * T, 5_000).unwrap();
        assert_eq!(bps_of(200 * T, 5_000).unwrap(), 100 * T);
        assert_eq!(locked, 100 * T);
        assert_eq!(
            settlement(locked, 0, 300).unwrap(),
            Settlement {
                fee: 3 * T,
                to_pool: 3 * T,
                to_freelancer: 97 * T
            }
        );
    }

    #[test]
    fn spec_b_advance_200_at_50_percent() {
        let locked = locked_amount(200 * T, 5_000).unwrap();
        let advance = bps_of(locked, 8_000).unwrap();
        assert_eq!(advance, 80 * T);
        assert_eq!(
            settlement(locked, advance, 300).unwrap(),
            Settlement {
                fee: 3 * T,
                to_pool: 83 * T,
                to_freelancer: 17 * T
            }
        );
    }

    #[test]
    fn spec_c_advance_200_at_20_percent() {
        assert_eq!(bps_of(200 * T, 2_000).unwrap(), 40 * T);
        let locked = locked_amount(200 * T, 2_000).unwrap();
        let advance = bps_of(locked, 8_000).unwrap();
        assert_eq!(advance, 128 * T);
        assert_eq!(
            settlement(locked, advance, 300).unwrap(),
            Settlement {
                fee: 4_800_000,
                to_pool: 132_800_000,
                to_freelancer: 27_200_000
            }
        );
    }

    #[test]
    fn settlement_never_underflows_when_rates_sum_to_100_percent() {
        // Worst case rounding with advance_bps + fee_bps == 10000.
        for locked in [1, 3, 7, 9_999, 10_001, u64::MAX] {
            let advance = bps_of(locked, 9_999).unwrap();
            assert!(settlement(locked, advance, 1).is_ok());
        }
    }

    #[test]
    fn settlement_rejects_payouts_above_locked() {
        assert!(settlement(100, 99, 300).is_err());
    }
}
