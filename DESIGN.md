---
name: PactVault
description: Sign the pact. Lock the vault. Get paid.
colors:
  ground: "#f7f6f1"
  card: "#ffffff"
  ink: "#13231c"
  ink-muted: "#4f5f57"
  stone: "#eeede6"
  hairline: "#e3e1d8"
  input-edge: "#d6d4c9"
  vault-green: "#0f7a4f"
  vault-green-hover: "#0b5e3c"
  vault-green-soft: "#e3f1ea"
  on-green: "#ffffff"
  ledger-blue: "#1f5fa8"
  ledger-blue-soft: "#e6eef8"
  thread-teal: "#12897f"
  alarm-red: "#b42318"
  selection: "#cfe8dc"
  ground-dark: "#0b1512"
  card-dark: "#12201b"
  ink-dark: "#edefe9"
  ink-muted-dark: "#a9b5ae"
  stone-dark: "#1a2b25"
  hairline-dark: "#22352e"
  input-edge-dark: "#2c4239"
  vault-green-dark: "#3fcf8e"
  vault-green-hover-dark: "#5adba0"
  vault-green-soft-dark: "#143326"
  on-green-dark: "#0b1512"
  ledger-blue-dark: "#6fb1f0"
  ledger-blue-soft-dark: "#14263a"
  thread-teal-dark: "#4cc9bd"
  alarm-red-dark: "#f97066"
  selection-dark: "#1f4a37"
typography:
  display:
    fontFamily: "Space Grotesk, Public Sans, sans-serif"
    fontSize: "clamp(2.4rem, 5vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk, Public Sans, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  money:
    fontFamily: "Space Grotesk, Public Sans, sans-serif"
    fontSize: "clamp(1.6rem, 4vw, 2.1rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\" 1"
  title:
    fontFamily: "Space Grotesk, Public Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "\"tnum\" 1"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  pill: "26px"
  full: "9999px"
spacing:
  gutter: "20px"
  gutter-sm: "32px"
  card-pad: "24px"
  card-pad-sm: "32px"
  step-gap: "32px"
  section-gap: "64px"
  section-gap-lg: "80px"
  header-height: "64px"
components:
  button-primary:
    backgroundColor: "{colors.vault-green}"
    textColor: "{colors.on-green}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.vault-green-hover}"
  button-primary-dark:
    backgroundColor: "{colors.vault-green-dark}"
    textColor: "{colors.on-green-dark}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    size: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.stone}"
  badge-identity:
    backgroundColor: "{colors.ledger-blue-soft}"
    textColor: "{colors.ledger-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    height: "20px"
  nav-link:
    textColor: "{colors.ledger-blue}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.card-pad}"
  ledger:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  notice-success:
    backgroundColor: "{colors.vault-green-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  notice-info:
    backgroundColor: "{colors.ledger-blue-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
---

# Design System: PactVault

## Overview

**Creative North Star: "The Signed Ledger"**

PactVault reads like a well-kept ledger on warm paper: a calm, trustworthy fintech surface where every figure is legible and every page asks for one thing. The ground is a warm off-white (dark: a deep green-black), content sits on plain white cards with hairline edges, and the ink is a deep green-black rather than pure black. Colour is spent sparingly and by role, never for decoration: green means "do this" or "this is money", blue means "this is a link or an identity", teal draws the quiet structure (icons, dividers, the thread between stages, the focus ring).

Density is low. Pages are a single column of intent: a large Space Grotesk statement, one plain sentence, one green action, and the real mechanism beside it. The signature device is the pact thread: stages joined by a hairline teal line through outlined teal icon rings, ending on a money state. The system refuses the crypto default of dark neon, gradient text and hero metrics; nothing here implies real money, and devnet is always labelled.

Light and dark are equal citizens. The theme follows the system setting by default with a manual Light / Dark / System toggle (class strategy), and every role has a tuned dark counterpart rather than an inversion.

**Key Characteristics:**
- Warm off-white ground, white cards, deep green ink; dark mode is green-black, not grey.
- Three colour roles with hard boundaries: green for action and money, blue for links and identity, teal for non-text structure.
- One green action per page.
- Money in tabular numerals, in green, with the unit set smaller beside it.
- Hairline borders and teal-tinted dividers over heavy shadows.
- Space Grotesk headings with tight tracking; Public Sans for everything read; Geist Mono only for addresses.

## Colors

A green-dominant, blue-supporting palette on warm paper, with teal held back for structure only.

### Primary
- **Vault Green** (vault-green; dark: vault-green-dark): the one main action per page (Connect wallet, Get test USDC) and every money figure, balance and money state. Hover deepens in light mode (vault-green-hover) and brightens in dark mode (vault-green-hover-dark). Also the text caret. The one owner-approved exception is the "Vault" half of the wordmark.
- **Vault Green Soft** (vault-green-soft): the tint behind a success/money-arrived notice; never a fill for buttons.

### Secondary
- **Ledger Blue** (ledger-blue; dark: ledger-blue-dark): links, nav links, info notices, explorer links, the Devnet badge and the connected-wallet identity badge.
- **Ledger Blue Soft** (ledger-blue-soft): the pill fill behind blue badges and the background of info/rate-limit notices.

### Tertiary
- **Thread Teal** (thread-teal; dark: thread-teal-dark): non-text only. Icons, icon rings (at 40% opacity), the pact thread (50%), ledger and balance dividers (25%), the current-page nav underline (60%) and the focus ring. Never body or label text: it falls below AA at small sizes.

### Neutral
- **Warm Paper** (ground; dark: ground-dark): page background.
- **Card White** (card; dark: card-dark): cards, panels, popovers, the wallet modal.
- **Deep Ledger Ink** (ink; dark: ink-dark): headings and body text.
- **Muted Ink** (ink-muted; dark: ink-muted-dark): supporting sentences, captions, helper text, quiet controls such as Disconnect and Refresh.
- **Stone** (stone; dark: stone-dark): muted/secondary surfaces, ghost hover, skeleton fill.
- **Hairline** (hairline; dark: hairline-dark): borders and the header rule. **Input Edge** (input-edge) for field strokes.
- **Alarm Red** (alarm-red; dark: alarm-red-dark): errors only, usually as a 10% tint with a red icon and ink text.
- **Selection** (selection; dark: selection-dark): text selection, a pale green under ink.

### Named Rules
**The Three Roles Rule.** Green is action and money. Blue is links, info and identity. Teal is structure that is never read. A colour used outside its role is a bug, with one exception: the green "Vault" in the wordmark.

**The One Green Action Rule.** Each page has exactly one filled green button. Secondary choices are ghost, outline or quiet text controls.

**The Dark Text On Green Rule.** In dark mode, green buttons carry dark text (on-green-dark), never white.

## Typography

**Display Font:** Space Grotesk (with Public Sans, sans-serif)
**Body Font:** Public Sans (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace), for wallet and mint addresses only

**Character:** Space Grotesk gives the headings a slightly engineered, contractual edge; Public Sans keeps everything people actually read plain and civic. h1 to h3 balance their lines; paragraphs wrap with `pretty`.

### Hierarchy
- **Display** (600, clamp(2.4rem, 5vw, 3.75rem), 1.04, -0.03em): the home statement, one beat per line.
- **Headline** (600, clamp(2rem, 4.5vw, 2.75rem), 1.25, -0.03em): the H1 on operational pages such as the faucet.
- **Money** (Space Grotesk 600, clamp(1.6rem, 4vw, 2.1rem), line-height 1, tabular): headline balances, in green, with the unit in Public Sans 0.875rem 500 beside it.
- **Title** (600, 1.125rem, tight tracking): stage titles and section titles.
- **Lead** (400, 1.125rem, 1.625): the one plain sentence under a headline, capped at 44 to 52ch.
- **Body** (400, 0.875 to 0.95rem, relaxed): stage descriptions, helper text, ledger rows.
- **Label** (500, 0.75rem): badges, units, fine print.

### Named Rules
**The Tabular Money Rule.** Every amount uses tabular numerals and two decimals for USDC; the unit sits after the figure at a smaller size.

**The Mono Is For Addresses Rule.** Geist Mono appears only on wallet, mint and transaction identifiers, shortened as `abcd…wxyz`.

## Layout

A centred container with generous breathing room. The header is a 64px bar under a hairline rule, sharing the page container width (72rem) with 20px gutters, 32px from the `sm` breakpoint. Home is a flex row from `lg`: the hero (flex 1.05, sticky at 96px from the top) on the left, the pact sequence (flex 1) on the right, 80px apart; below `lg` they stack with 64px between. Operational pages such as the faucet use a narrow 42rem single column. Top padding is 56px, rising to 80 to 96px at `lg`; bottom padding 80px. Inside a panel, padding is 24px, 32px from `sm`. The pact stages sit 32px apart on a 40px icon column with 16px to the text.

## Elevation & Depth

Mostly flat. Depth comes from the white card on warm paper and a hairline border; shadows are soft, low and green-black tinted (rgb 11 21 18), with large negative spread so they read as a lift under the card's lower edge rather than a halo.

### Shadow Vocabulary
- **Button rest** (`box-shadow: 0 1px 2px rgb(11 21 18 / 0.12)`): under the filled green button only.
- **Ledger lift** (`box-shadow: 0 8px 24px -16px rgb(11 21 18 / 0.35)`): the example ledger card.
- **Panel lift** (`box-shadow: 0 12px 32px -24px rgb(11 21 18 / 0.4)`): the main operational panel.
- **Modal** (`box-shadow: 0 16px 48px -12px rgb(11 21 18 / 0.35)`): the wallet picker over a 55% green-black scrim.

### Named Rules
**The Border First Rule.** Every raised surface has a hairline border; the shadow is optional and never replaces the border.

## Shapes

Gently rounded, never pill-shaped except for badges. The base radius is 10px: buttons and notices use it, the nav link and modal list items use 8px, the ledger card 14px, the main panel 18px, badges a full pill. Icon rings in the pact thread are full circles with a 1px teal edge at 40%. Dividers inside money tables are 1px teal at 25%; structural borders use the hairline neutral.

## Components

### Buttons
Calm, solid and a little tactile: a 1px press on active.
- **Shape:** gently rounded (10px).
- **Primary:** Vault Green fill, white text (dark: dark text on bright green), 44px tall with 20 to 24px side padding and 0.95rem medium text when it is the page action; a leading or trailing 16px icon.
- **Hover / Focus:** hover deepens (light) or brightens (dark) to the hover green; focus shows the teal ring; disabled at 50% opacity.
- **Ghost:** transparent, Stone on hover; used for the theme toggle (32px icon button with a teal sun/moon).
- **Link:** blue text, underline on hover.
- **Quiet text control:** muted ink, ink and underline on hover (Disconnect, Refresh).

### Chips
- **Style:** the blue identity pill: Ledger Blue Soft fill, Ledger Blue text, 0.75rem medium, full pill. Used for the Devnet badge and, at 28px tall with the wallet icon and mono address, the connected-wallet badge that links to the explorer.

### Cards / Containers
- **Corner Style:** 14px (ledger) to 18px (panel).
- **Background:** Card White on Warm Paper.
- **Shadow Strategy:** ledger lift or panel lift (see Elevation).
- **Border:** 1px hairline.
- **Internal Padding:** 16px for the ledger, 24px / 32px for panels; panel footers sit under a hairline in 0.75rem muted text.

### Navigation
- **Style:** blue nav links (0.875rem medium) at the right of the header, with the theme toggle after them. The current page carries `aria-current` and a lasting 2px teal underline at 60%. Wordmark at left: the owner-supplied vault-door mark (light and dark variants, 28px), then "Pact" in ink and "Vault" in green, Space Grotesk bold 1.125rem, followed by the blue Devnet badge.

### Notices
Inline status lines in a 10px rounded tint with a 16px icon and ink text: success on Vault Green Soft with a green check and the green amount; rate limit on Ledger Blue Soft with a blue clock; error on a 10% red tint with a red alert icon. Announced through a polite live region.

### Pact Thread (signature)
A vertical list of stages, each a 40px teal-ringed circle holding a 20px teal icon, a title and one line of muted body. A 1px teal line at 50% joins each ring to the next. The last stage ends on a money state: the example ledger, whose rows are label left, green tabular amount right, divided by 25% teal hairlines.

### Balance Cells
Two-up money readout between 25% teal rules: a muted label over a green Money-scale figure with its unit. While loading, a Stone skeleton bar pulses in place of the figure.

## Do's and Don'ts

### Do:
- **Do** keep exactly one filled green button per page; it is the page's main action.
- **Do** set every amount in green tabular numerals with the unit smaller beside it.
- **Do** use blue for every link, the Devnet badge and wallet identity badges.
- **Do** keep teal to icons, rings, dividers, the pact thread and the focus ring.
- **Do** use dark text (#0B1512) on green buttons in dark mode.
- **Do** give raised surfaces a hairline border before any shadow, and tint shadows green-black.
- **Do** follow the system theme by default and keep the Light / Dark / System toggle in the header.
- **Do** use the owner-supplied mark files as they are, light and dark variants.

### Don't:
- **Don't** set text in teal; it is below AA at small sizes.
- **Don't** use green for decoration, headings or non-money emphasis (the "Vault" wordmark is the only exception).
- **Don't** use dark neon, gradient text or hero metrics.
- **Don't** put white text on the dark-mode green.
- **Don't** use Geist Mono for anything except addresses and identifiers.
- **Don't** redraw or recolour the brand mark.
