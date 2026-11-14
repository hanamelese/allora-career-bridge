# allora-career-bridge

Accessible Onboarding System — Partner (Vendor) Dashboard, shared Form Engine
and the API behind them.

## Layout

| Path | What it is |
| --- | --- |
| `packages/contracts` | Field catalogue, accommodation catalogues, form templates and the Zod schemas. Shared by the dashboard, the engine and the API. |
| `packages/form-engine` | Headless engine (`src`) plus its React bindings (`react`). The dashboard preview and the future embedded widget render with the same code. |
| `Frontend` | The partner dashboard (React + Vite). |
| `API` | Express + SQLite + Drizzle. Dashboard API and the public form API. |

## Running it

```bash
npm install

# One-off: the API needs a signing secret and a seeded partner.
cp API/.env.example API/.env     # then set JWT_SECRET
npm run db:seed -w api           # prints the sign-in details and the keys once

npm run api                      # http://localhost:3001
npm run dev                      # http://localhost:5173
```

The dashboard calls `/api/v1` on its own origin; Vite proxies that to the API,
so no API address is baked into the bundle.

`npm test` runs the contracts, engine and API suites.

## Notes

- The secret key is shown once by the seed and stored only as a hash. It never
  reaches the browser; the dashboard only ever holds the `pk_` public key.
- Published form versions are immutable — enforced in the publish route and by
  triggers on `form_versions`.
- `API/.env` and `API/data/` are git-ignored.
- On start, the API upgrades stored Learner Registration drafts to the merged
  Learner Registration & Profile form (published versions are never touched).

## Referral SMS

A learner who has no identity document can ask, at the end of the learner
form, for a link to be sent by SMS to the organisation's referral partners
(managed under **Organisation → Referral partners**). The link opens
`/referrals/:token`, where the partner sees the learner's name and phone and
can accept the referral.

**No SMS provider is wired up yet.** With `SMS_PROVIDER` unset, every send
fails with `sms_not_configured` and nothing is reported as sent. To enable
it, add a provider in `API/src/sms/index.js` and put its credentials in
`API/.env` (never in the frontend). Set `PUBLIC_APP_URL` to where the
dashboard is served so links in messages point to it.
