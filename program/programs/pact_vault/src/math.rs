//! Share math, kept free of accounts so it can be unit tested on its own.
//!
//! Both conversions round down, so rounding always favours the pool and
//! never lets an investor take out more than they put in.

use anchor_lang::prelude::*;

use crate::error::PactVaultError;

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
}
