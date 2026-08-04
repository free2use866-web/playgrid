# PlayGrid

PlayGrid is a private, play-money-only sports prediction and arcade platform.
Credits cannot be bought, sold, transferred, withdrawn, or redeemed.

## Current build

- Google is the only sign-in method.
- Supabase rejects new accounts unless Google verifies an email under an enabled
  IIT domain.
- New members receive 500 Sports credits and 500 Arcade credits.
- Referrals award both members 50 Sports and 50 Arcade credits after verified
  onboarding.
- Student routes include Sports, Dice, Mines, Plinko, leaderboards, onboarding,
  help, and fairness receipts.
- Admin routes require both the `admin` role and an AAL2 MFA session.
- Ledger history is append-only; corrections are compensating entries.

See [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) for boundaries and launch
gates.

## Local development

```bash
npm run dev
```

Configure:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_NAME
```

Database migrations are under `supabase/migrations`.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm test
```

## Permanent product constraint

Do not add deposits, purchases, fiat or crypto on-ramps, withdrawals,
redemption, cash-out, or transferable credits. No interface may imply monetary
value.
