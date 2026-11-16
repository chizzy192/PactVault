use anchor_lang::prelude::*;

#[error_code]
pub enum PactVaultError {
    #[msg("Basis points must be between 0 and 10000")]
    InvalidBps,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Shares must be greater than zero")]
    ZeroShares,
    #[msg("Deposit is too small to mint any shares")]
    DepositTooSmall,
    #[msg("Withdrawal is too small to return any tokens")]
    WithdrawTooSmall,
    #[msg("Position does not hold enough shares")]
    InsufficientShares,
    #[msg("Vault does not hold enough tokens for this withdrawal")]
    InsufficientLiquidity,
    #[msg("Token mint does not match the pool mint")]
    InvalidMint,
    #[msg("Token account is not owned by the investor")]
    InvalidTokenOwner,
    #[msg("Signer is not the owner of this position")]
    Unauthorized,
    #[msg("Arithmetic overflow or division by zero")]
    MathOverflow,
}
