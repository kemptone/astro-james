# City Temperature Game

The new game lives at `/city-temperature`. It is independent from both
`/extraspecial` and the existing `/citytemperature` Sky Maker game.

## Local setup

Guest play works immediately and saves the map plus mock unlocks in
`localStorage`. Account saving is enabled only when all required account
variables in `.env.example` are configured.

1. Copy the City Temperature Game values from `.env.example` into `.env`.
2. Create a Neon/PostgreSQL database and set `DATABASE_URL`.
3. Run `npm run db:generate` after schema changes, then run `npm run db:migrate`
   to apply the SQL in `drizzle/`.
4. Configure the Google OAuth callback as
   `${BETTER_AUTH_URL}/api/auth/callback/google` if Google sign-in is wanted.
5. Configure a verified Resend sender in `AUTH_EMAIL_FROM` for verification and
   password-reset messages.

The game stays fully playable as a guest when account configuration is absent.
The account button explains that cross-device saving is unavailable.

## Pretend purchases

Heater and Connect Lines each display as a separate pretend $20 purchase. The
confirmation says that a father's credit card will be charged, then immediately
clarifies that no real card is accessed and no money is charged. Completing the
pretend purchase marks the feature as `Purchased`, unlocks it immediately, and
stores the entitlement in `localStorage`.

Signed-in users also sync those mock entitlements to the database with
`POST /api/city-temperature/mock-purchase`. `DELETE` on the same endpoint marks
both mock entitlements refunded. The Refund / Reset Purchases button clears the
browser entitlements, returns Heater mode to Normal, and removes saved
connection lines.

There is no Stripe dependency, Checkout route, webhook, price ID, or live
charge in the current implementation. The commented Stripe names in
`.env.example` are only placeholders for a later production-payment phase.

## Verification

- `npm run test:city-temperature` runs the temperature and validation unit tests.
- `npm run check:city-temperature` type-checks only this feature, avoiding
  unrelated legacy errors elsewhere in the repository.
- `npm run build` verifies the production Astro/Vercel build.
