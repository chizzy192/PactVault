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
    #[msg("Pool does not have enough idle tokens for this withdrawal")]
    InsufficientLiquidity,
    #[msg("Token mint does not match the pool mint")]
    InvalidMint,
    #[msg("Token account is not owned by the investor")]
    InvalidTokenOwner,
    #[msg("Signer is not allowed to perform this action")]
    Unauthorized,
    #[msg("Arithmetic overflow or division by zero")]
    MathOverflow,
    #[msg("Pool mint must have 6 decimals")]
    InvalidMintDecimals,
    #[msg("advance_bps + fee_bps must not exceed 10000")]
    InvalidBpsSum,
    #[msg("Upfront basis points must not exceed 5000")]
    InvalidUpfrontBps,
    #[msg("Client and freelancer must be different wallets")]
    SameParty,
    #[msg("Resolver must differ from both the client and the freelancer")]
    InvalidResolver,
    #[msg("Review window must be between 60 and 604800 seconds")]
    InvalidReviewWindow,
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    #[msg("Escrow is not in the right status for this action")]
    InvalidEscrowStatus,
    #[msg("Contract hash does not match the escrow")]
    ContractHashMismatch,
    #[msg("This party has already signed the contract")]
    AlreadySigned,
    #[msg("Signer is neither the client nor the freelancer")]
    NotParty,
    #[msg("Signer is not the escrow's client")]
    NotClient,
    #[msg("Signer is not the escrow's freelancer")]
    NotFreelancer,
    #[msg("An advance has already been taken on this escrow")]
    AdvanceAlreadyTaken,
    #[msg("Advance would be zero")]
    ZeroAdvance,
    #[msg("The client's review window has not ended yet")]
    ReviewWindowOpen,
    #[msg("Token account is not owned by the escrow's freelancer")]
    InvalidFreelancerTokenAccount,
}
