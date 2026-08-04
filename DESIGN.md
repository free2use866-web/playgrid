# PlayGrid interface system

PlayGrid uses one shared product grammar with three deliberately distinct
visual modes. The modes should feel related through typography, spacing,
accessibility, and interaction quality—not by sharing the same accent colour.

## Global rules

- Interface type: Geist Sans. Numeric data: Geist Mono with tabular figures.
- Use a compact 4 px spacing rhythm and a 10 px default corner radius.
- Interactive targets are at least 44 px on touch layouts.
- Focus rings must be visible without relying on colour alone.
- Motion explains state or hierarchy. Prefer transform and opacity, keep
  feedback under 220 ms, and honour `prefers-reduced-motion`.
- Avoid generic gradient/glass dashboards, excessive nested cards, copied
  logos, copied artwork, and decorative motion with no state meaning.
- Play credits never look purchasable, redeemable, or equivalent to money.

## Entry and authentication

Mood: warm, calm, editorial, trustworthy.

- Canvas: warm ivory (`#F4F0E7`).
- Raised surface: paper (`#FFFDF8`).
- Text: espresso (`#292521`).
- Muted text: stone (`#746D64`).
- Accent: terracotta (`#C86549`), used sparingly.
- Borders: warm grey (`#DDD5C9`).
- Layout variance: asymmetric desktop split; focused single-column mobile.
- Motion intensity: restrained hover lift, press depth, and short entrance
  transitions only.
- Google remains the only real sign-in method. Student and Admin demos are
  clearly labelled as isolated test environments, never alternative real auth.

## Sports

Mood: analytical, calm, market-focused.

- Canvas: ice (`#F5F8FC`) with ink text (`#10233D`).
- Raised surface: white (`#FFFFFF`).
- Primary: cobalt (`#2563EB`).
- Secondary data accent: cyan-blue (`#0284C7`).
- Positive/confirmed: teal (`#0F9F8F`).
- Negative/closed: red (`#D84A5F`).
- Borders: blue-grey (`#D8E2EE`).
- Odds, shares, pools, and receipts must align cleanly and remain readable at
  320–430 px. The mobile bet slip is an intentional bottom panel with safe-area
  padding and must never cover the selected market without a clear close action.

## Casino

Mood: dense, tactile, high-contrast game console.

- Canvas: deep navy (`#0F212E`).
- Control surface: blue slate (`#1A2C38`).
- Raised surface: steel (`#213743`).
- Primary action and wins: electric green (`#00E701`).
- Loss: rose (`#ED4163`).
- Warning/current lane: amber (`#FFC642`).
- Game stages use original PlayGrid art with clear depth, press feedback,
  purposeful cursor states, and deterministic geometry.
- Chicken has one authoritative lane coordinate. Lane highlight, chicken
  position, traffic, collision, explosion, and multiplier must derive from that
  same coordinate at every viewport size.

