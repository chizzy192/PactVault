# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: Nigerian freelancers.** They agree a job with a client, want the
  payment locked before they start, and want to be paid as soon as they
  submit the work rather than waiting on the client's approval.
- **Primary: their clients.** They want to pay only for agreed, delivered
  work, with terms both sides signed, and a fair review window before money
  is released.
- **Secondary (for now): investors.** They deposit into a shared pool that
  funds freelancers' advances and earn a fee when escrows settle. They are
  served, but freelancers and clients come first; investor screens stay
  minimal.

## Product Purpose

PactVault lets a freelancer and a client agree a contract, lock the payment
in a Solana vault, and get the freelancer paid when they submit the work.
Success means a freelancer can go from "we agreed" to "I've been paid" without
trusting the client to pay later, and a client only releases money against
signed terms and submitted work.

## Positioning

The freelancer can be paid at submission, not at approval: once work is
submitted, they can take an advance (80% of the locked amount) from an
investor pool, repaid automatically from the client's locked funds when the
escrow settles. The client's money is locked on-chain before work starts, both
parties sign the same contract hash, and if the client goes quiet the escrow
auto-releases after the agreed review window.

## Operating Context

- Contracts are drafted by chat: an AI drafts the terms from the conversation,
  and the client and freelancer discuss and edit them before both sign.
- Flow: draft → both sign → client funds (optional upfront part, up to 50%,
  goes straight to the freelancer) → freelancer submits work (proof hash) →
  optional advance → client approves, or anyone triggers auto-release after
  the review window → settled.
- Wallets: users connect a Solana wallet (Phantom). Currently Solana devnet
  only, with a test USDC token and a faucet.
- Money is shown in USDC (what is actually locked) with an approximate naira
  (₦) equivalent alongside.

## Capabilities and Constraints

**Built (on-chain, devnet):**
- Investor pool: deposit test USDC for shares, withdraw by burning shares;
  share price moves only through the pool's own books (`idle_assets` +
  `outstanding_advances`).
- Escrow: create (client or freelancer), sign with matching contract hash,
  fund, upfront payment (≤ 50%), submit work, one advance per escrow (80% of
  locked, only after submission, only if the pool has the liquidity),
  approve, auto-release after a review window of 60 seconds to 7 days.
- Settlement: 3% fee on the locked amount goes to the pool on every
  settlement; the pool is repaid advance + fee; the freelancer gets the rest.
- Devnet faucet for test USDC and a little SOL for fees.

**Terminology:** pact / contract, vault / escrow vault, upfront, locked,
advance, review window, auto-release, settle, pool, shares, investor.

**Not built yet / undecided:**
- The chat drafting experience (AI + two-party discussion).
- Disputes: a resolver is recorded on every escrow but dispute handling does
  not exist; `Disputed` and `Cancelled` statuses are unused.
- Cancelling or refunding a funded escrow; enforcing the deadline.
- Which ₦ exchange rate source to use and how often it updates (amounts must
  be labelled as approximate).
- Primary devices and connectivity of users (not confirmed).
- Mainnet launch and real USDC (devnet only today).

## Brand Commitments

Binding, as given by the product owner:

- **Name:** PactVault. **Tagline:** "Sign the pact. Lock the vault. Get paid."
- **Feel:** calm, trustworthy fintech. Clean and uncluttered.
- **Colour:** green dominant, blue supporting, warm off-white backgrounds.
  Light and dark mode, following the system setting by default, with a
  manual toggle.
  - Light: page #F7F6F1, card #FFFFFF, text #13231C, primary green #0F7A4F,
    hover #0B5E3C, blue #1F5FA8, teal #12897F.
  - Dark: page #0B1512, card #12201B, text #EDEFE9, primary green #3FCF8E
    with dark text on it, hover #5ADBA0, blue #6FB1F0, teal #4CC9BD.
  - Green: the one main action per page, and money states.
  - Blue: links, info and identity badges.
  - Teal: non-text accents only (icons, focus rings, dividers, charts).
- **Type:** Space Grotesk for headings; a plain sans-serif for body text.

## Evidence on Hand

None yet: no users, testimonials, case studies, volumes or partners. The
product runs on Solana devnet with test USDC only. Future work must not
invent customers, figures, endorsements, or mainnet/real-money claims.

## Product Principles

1. **Money is always legible.** At every step show what is locked, paid,
   advanced, and still to come, in USDC with an approximate ₦ value.
2. **Terms before money.** Nothing moves until both sides have signed the
   same terms; make it obvious what was agreed and by whom.
3. **Freelancer and client first.** Investors are served, but their needs
   never complicate the freelancer/client path.
4. **Calm, one decision at a time.** Each page asks for one main action;
   status and next step are never ambiguous.
5. **Honest about the stage.** Devnet and test funds are always clearly
   labelled; nothing implies real money until it is real.

## Accessibility & Inclusion

- Text and interactive colour pairs meet WCAG AA contrast in both themes
  (teal is reserved for non-text accents because it falls below AA for small
  text; dark-mode green buttons use dark text).
- Respect the system light/dark preference by default.
