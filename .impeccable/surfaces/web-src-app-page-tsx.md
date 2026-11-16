---
version: 1
slug: "web-src-app-page-tsx"
primary_target: "web/src/app/page.tsx"
related_targets: ["web/src/app/faucet/page.tsx"]
---

# Surface: home "/" and faucet "/faucet" (devnet stage)

Scope: "/" is Persuade (first visit, connect wallet). "/faucet" is Operate (get test funds, read balances).
Audience: Nigerian freelancers and their clients (see PRODUCT.md). Devnet and test USDC are always labelled.
Action: "/" connect Phantom, then the next step points to /faucet. "/faucet" one action: "Get 1,000 test USDC".
Proof/content: the real mechanism only (sign, lock, get paid); no stats, testimonials, or mainnet claims.
Faucet states: wallet not connected, loading balances, requesting, success (explorer link), rate-limited (time left), error.

## Direction contract

THESIS: The pact is the page. The home page shows the mechanism as one connected sequence (sign the pact, lock the vault, get paid) instead of a hero plus feature cards; it refuses the crypto default of dark neon, gradient text and hero metrics.

OWN-WORLD: Warm off-white ground with white cards (dark: deep green-black ground, green-black cards); deep green ink. Green owns the single action and every money figure; blue only for links, wallet/identity badges and info; teal only for hairline dividers, icons, the connecting thread and the focus ring. Space Grotesk headings, plain sans body (Public Sans), tabular numerals for amounts.

STORY: A freelancer or client understands in one read that money is locked before work starts and released when work is submitted, connects Phantom, and is pointed to the faucet for test USDC.

FIRST VIEWPORT: Header: vault-door wordmark, blue Devnet badge, Faucet link (current-page state on /faucet), theme toggle. Hero: the tagline as the H1 at display scale, one beat per line; one plain sentence; green Connect wallet button (after connect: blue wallet badge plus green "Get test USDC" next step). Beside the hero on desktop (hero left, steps right), below it on mobile: three stages joined by a vertical teal thread, each an icon, short title and one line; the third ends on a green money state (example ledger).

FORM: seed: none (pinned) — "Feel: calm, trustworthy fintech. Clean and uncluttered." / "green is dominant, blue is the supporting colour, backgrounds are warm off-white" / "Font: Space Grotesk for headings, a plain sans-serif for body text." / "/ : the name PactVault, the tagline … and a connect-wallet button" / "Add the 3-step pact: Below the tagline, show the mechanism in three short steps (Sign the pact → Lock the vault → Get paid)" / "Point to the faucet: Stay on "/" and show a clear next step: "Get test USDC" linking to /faucet" / owner override of placement: "please make the home page a flex like before" (side by side on desktop).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Naira (₦) rate source: not used on these surfaces yet.
- Motion: no authored motion moment yet (candidate: the teal thread drawing through the three stages).
