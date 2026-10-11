# KiosAI prototype

Responsive React prototype for an Indonesian AI token marketplace.

## Explore

- Five workspace screens: API Keys, Beli Token, Playground, Statistik, Dokumentasi.
- Desktop sidebar and mobile bottom navigation.
- Open **Mode demo** in the header for the component catalog and state scenarios.
- Purchase a package, confirm the simulated payment, then inspect the updated balance, tier access and order history.
- Playground replies are local examples. Model tier determines the simulated token multiplier.
- Demo keys exist only in memory. They are not valid gateway credentials.
- Refresh or use **Reset data demo** to restore the starting state.

## Component library

`src/components/ui.tsx` exports Button, Input, Badge, Card, TableRow, CodeBlock
and SkeletonRows. The catalog includes primary/secondary/ghost buttons in
default/hover/disabled/loading states. Colors, spacing, radii, type sizes,
font families, weights and line heights can be downloaded from
`public/kiosai-tokens.json`.

The repository contains application code and JSON tokens, not a native Figma
Design file. Native variables, component sets, auto-layout layers and canvas
prototype links must be created separately with a Figma authoring workflow.

## Accessibility

- Modal focus trap, Escape dismissal, background inertness, scroll lock and focus restoration.
- Input labels and associated error messages.
- Keyboard-accessible overflow tables and code-language tabs.
- Orange focus rings and reduced-motion support.
- Explicit demo labels on payment, authentication, API keys and chat.

## Verification

Commands: `pnpm build`, `pnpm exec tsc --noEmit`, and scoped `pnpm format`.
Browser checks were run against the supervised preview using Chromium at
390px and 1440px. Checks covered navigation, QRIS pending/success/expiry,
balance and tier updates, key creation/revocation, reply billing, order history,
code tabs, rate limiting, low balance, skeleton/empty states and modal keyboard
navigation. WCAG A/AA automated checks are useful evidence, not a complete
accessibility certification.

## Production boundary

There is no backend or external financial/AI integration. A production release
requires authentication, server-side key issuance and authorization, a payment
provider with signed webhooks and idempotent fulfillment, transactional token
accounting, rate enforcement and an actual OpenAI-compatible gateway.
Never place provider credentials or trust token balances in client-side code.
The example `https://api.kios.ai/v1` URL illustrates the proposed API contract;
this prototype does not establish ownership or availability of that service.
