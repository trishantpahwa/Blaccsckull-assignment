# Feedants – Competition Details

This is the competition details screen from the Feedants design, built as a working feature. The React Native (Expo) app talks to an Express API backed by MongoDB. Every value on the screen comes from the API: prize pool, spots left, dates, countdown, judge, rewards, winners and the state of the bottom button. Registration takes an entry fee through Razorpay, and registered users can upload their video entry.

```
backend/   Express + TypeScript + Mongoose API
mobile/    Expo (SDK 57) + TypeScript app using expo-router
render.yaml  Render blueprint for the API
```

## Running it locally

You need Node 20 or newer and a MongoDB database. The database must be a replica set, because registration uses transactions. Atlas (including the free tier) is fine.

### Backend

```bash
cd backend
cp .env.example .env      # fill in MONGODB_URI and JWT_SECRET at minimum
npm install
npm run seed              # creates the competitions, testimonials and a demo user
npm run dev               # http://localhost:4000
```

The seed can be run again safely. It updates the competitions in place and recalculates `bookedCount` from the existing registrations. `npm run seed -- --reset` also clears all registrations. The dates are set relative to when you seed, so after a few days you should seed again to get a live countdown.

Demo login: `demo@feedants.com` / `demo1234`

Tests run against an in-memory MongoDB replica set, so no database setup is needed:

```bash
npm test
npm run typecheck
npm run lint
```

### Mobile

```bash
cd mobile
cp .env.example .env      # set EXPO_PUBLIC_API_URL
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` for an Android emulator or `w` for the browser. On a physical phone, `EXPO_PUBLIC_API_URL` must be your computer's LAN address (for example `http://192.168.1.20:4000`) or the Render URL, not `localhost`. Restart Expo after changing `.env`.

The main screen is under Competitions → Feedants Classical Dance.

## Environment variables

Backend (`backend/.env`):

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | Must point at a replica set. URL-encode special characters in the password (`@` becomes `%40`). |
| `JWT_SECRET` | yes | At least 16 characters. |
| `JWT_EXPIRES_IN` | no | Defaults to `7d`. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | for paid entries | Test mode keys. Without them, paid registration returns `503 PAYMENTS_UNAVAILABLE`. Free competitions still work. |
| `RAZORPAY_WEBHOOK_SECRET` | recommended | The secret you set when creating the webhook in the Razorpay dashboard. |
| `PUBLIC_BASE_URL` | no | The public URL of the API. It is used to build image, checkout and referral links. On Render it defaults to `RENDER_EXTERNAL_URL`, and locally to `http://localhost:4000`. |
| `CORS_ORIGINS` | no | A comma-separated list, or `*`. |
| `HOLD_MINUTES` | no | How long an unpaid registration holds a spot. Defaults to 10. |
| `REFERRAL_REWARD` | no | Credit per referred signup, in paise. Defaults to 1000 (₹10). |
| `PORT` | no | Defaults to 4000. Render sets it automatically. |

Mobile (`mobile/.env`): only `EXPO_PUBLIC_API_URL`.

## Razorpay setup

1. In the Razorpay dashboard, switch to Test mode and generate API keys. Put them in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
2. Add a webhook at `<API URL>/api/v1/webhooks/razorpay` for the `payment.captured` and `order.paid` events. Use its secret as `RAZORPAY_WEBHOOK_SECRET`.
3. In the checkout, use one of Razorpay's test cards or the test UPI ID `success@razorpay`.

The native Razorpay SDK doesn't run in Expo Go. Instead, the API serves a small page at `/checkout` that loads Razorpay's `checkout.js`, and the app opens that page in a WebView. The page passes the result back with `postMessage`, the app sends it to `/registrations/:id/verify`, and the server checks the HMAC signature before confirming the registration. The web build calls `checkout.js` directly.

## Deploying the API to Render

The repo includes `render.yaml`. In Render, choose New → Blueprint and point it at the repository. Render will ask for `MONGODB_URI` and the Razorpay keys, and it generates `JWT_SECRET` itself. To set the service up by hand instead, use root directory `backend`, build command `npm ci --include=dev && npm run build`, start command `npm start` and health check path `/health`.

In Atlas, allow connections from Render: add `0.0.0.0/0` under Network Access, or add Render's outbound IPs on a paid plan. To seed the production database, run `npm run seed` from your machine with `MONGODB_URI` pointing at it.

## API

Everything is under `/api/v1`. Errors always have the shape `{ "error": { "code", "message" } }`.

| Method | Path | Auth | |
| --- | --- | --- | --- |
| POST | `/auth/signup` | – | `name, email, password, referralCode?` |
| POST | `/auth/login` | – | |
| GET | `/auth/me` | yes | |
| GET | `/competitions?lang=en\|hi` | – | List |
| GET | `/competitions/:slug?lang=en\|hi` | optional | Details, lifecycle and the viewer's registration |
| GET | `/competitions/:slug/availability` | – | Spots and phase. The app polls this. |
| POST | `/competitions/:slug/registrations` | yes | Reserves a spot and returns a Razorpay order |
| GET | `/registrations/:id` | owner | |
| POST | `/registrations/:id/verify` | owner | Razorpay handler response |
| POST | `/registrations/:id/submission` | owner | multipart `file`, video only, up to 100 MB |
| GET | `/registrations/:id/submission/file` | owner | Streams the uploaded video |
| GET | `/testimonials` | – | |
| GET | `/referrals/me` | yes | Code, link, signups and earnings |
| POST | `/webhooks/razorpay` | signature | |

Other routes: `GET /health`, `GET /checkout` and `GET /r/:code` (the referral landing page).

## How registration works

A competition document stores `capacity` and `bookedCount`. Registering runs one transaction that does two things:

1. `updateOne({ _id, status: 'published', registrationClosesAt > now, $expr: bookedCount < capacity }, { $inc: { bookedCount: 1 } })`
2. inserts a `pending_payment` registration with `holdExpiresAt = now + HOLD_MINUTES`

The conditional increment is what prevents overbooking. When many users race for the last spot, MongoDB lets only one of them match the filter, and the rest get `409 SOLD_OUT`. A partial unique index on `(competition, user)` covers active statuses, so a double tap can't create two entries. There is a test that fires 50 registrations at a 20-spot competition and checks that exactly 20 succeed.

The Razorpay order is created after the transaction commits, so a slow gateway never holds a lock on the competition document. If creating the order fails, the hold is released immediately.

A payment is confirmed either by the app's verify call or by the webhook, whichever arrives first. Both go through the same idempotent function, so duplicates are harmless.

Unpaid holds are released by a sweeper that runs every minute inside the API process. It moves the registration to `expired` and gives the spot back, and it only decrements the counter when its own status update matched, so it is safe with several API instances running. If a payment arrives after its hold expired, the server tries to take a spot again. If the competition has filled up in the meantime, the registration becomes `refund_due` and the app says so.

## Screen states

The server works out the competition phase from the schedule (`upcoming`, `registration_open`, `awaiting_submissions`, `submission_open`, `judging`, `results_announced` or `cancelled`) along with the next deadline. The app combines that with the viewer's registration to decide what the bottom button does. The logic is in `mobile/src/lib/cta.ts`:

- logged out: "Log in to register"
- registration open: "Register Now · ₹99". The same button reads "Complete Payment" while a hold is active.
- full: "All spots booked"
- not open yet, or closed: disabled, with the relevant date
- registered, before submissions open: disabled, "Opens on …"
- registered, submissions open: "Upload Submission", and "Replace Submission" once a file has been uploaded
- after submissions close: "Results on …", then "Results announced"
- `refund_due`: explains that the refund is being processed

The countdown uses the server's clock rather than the phone's. Every response includes `serverTime`, and the app applies the offset. When a deadline passes, the app refetches so the phase changes without a manual refresh. The spots counter is refreshed every 15 seconds from the lightweight availability endpoint, and again whenever the screen gains focus.

The ENG/हिंदी toggle switches the UI strings and requests content in the chosen language from the API. Competition text is stored as `{ en, hi }` and falls back to English.

## Assumptions

- The screen shows one competition, identified by slug. The other tabs (Home, Explore, Create, Profile) are minimal and exist so the navigation works.
- "Registered" means the entry fee has been paid. An unpaid hold is shown as "Payment pending".
- A registration and its submission belong together, so a user has one entry per competition. Re-uploading replaces the previous video until the deadline.
- The design shows submissions opening before registration closes, so the two windows are allowed to overlap.
- Referral credit is paid when someone signs up with your code. The design says "earn more discount", but spending that credit at checkout is not built yet (see below).
- The judge and winner photos are cropped from the design image, and the videos are a public sample clip. The fourth winner's name is cut off in the design, so "Ishita Chopra" is a guess.
- All amounts are stored in paise as integers.

## Decisions and trade-offs

- **A counter on the competition document instead of counting registrations.** Reads stay O(1) and the capacity check is a single atomic update. The cost is that the counter can drift if data is edited by hand, so the seed script recalculates it, and a scheduled reconciliation job would be the next step.
- **Transactions.** These need a replica set, but they keep the counter and the registration consistent. Every competition shares one hot document, so under very heavy contention transactions retry. Once all spots are taken the filter no longer matches, and extra requests fail fast without writing anything.
- **Holding a spot during payment.** This stops users from paying for a spot that was taken while they were in checkout. The trade-off is that abandoned checkouts block a spot for up to `HOLD_MINUTES`.
- **A WebView checkout instead of `react-native-razorpay`.** The app keeps working in Expo Go. A production build would probably use the native SDK for a better UPI intent experience.
- **Videos in GridFS.** Render's disk is ephemeral and I didn't want to add another service for the assignment, so uploads stream straight into MongoDB without being buffered in memory. For real volume, object storage with pre-signed uploads (S3 or R2) is the right choice.
- **Polling instead of websockets for live spots.** It is simpler and works behind any proxy. The availability endpoint is small and sends `Cache-Control: public, max-age=5`, so a CDN can absorb most of the traffic.
- **A single JWT with no refresh token.** This is enough for the assignment. A production app would have short-lived access tokens and refresh rotation.
- **The sweeper runs inside the API process.** On Render's free tier the instance sleeps when idle, so expired holds are released after it wakes up. A user's own stale hold is also released as soon as they try to register again.

## What I'd do next for production

- Move uploads to S3/R2 with pre-signed URLs and background transcoding, and validate video duration on the server.
- Apply referral credit as a discount on the entry fee.
- Issue refunds for `refund_due` entries automatically through the Razorpay refunds API.
- Run holds and the sweeper as a separate worker or queue (for example BullMQ on Redis), and add a nightly job that reconciles `bookedCount`.
- Push spot updates over server-sent events or websockets instead of polling.
- Add refresh tokens, email verification and password reset.
- Add an admin API or panel to create competitions and announce results. Right now that happens through the seed script.
- Add a Redis-backed rate limiter so limits are shared across instances, plus structured metrics and alerting.
- Add end-to-end tests for the app with Maestro or Detox.
