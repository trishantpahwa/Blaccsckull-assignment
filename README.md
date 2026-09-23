# Feedants – Competition Details

The competition details screen from the Feedants design, built as a working feature: a React Native (Expo) app in `mobile/` and an Express + MongoDB API in `backend/`. Everything on the screen comes from the API, including spots left, dates, the countdown and the state of the bottom button. Registration takes the entry fee through Razorpay (test mode), and registered users can upload a video entry.

## Running it

You need Node 22 LTS (or 20.19.4+) and npm. To use the app, install Expo Go on a phone, or use an Android emulator.

**1. App only, using the hosted API (quickest)**

```bash
cd mobile
npm install
echo "EXPO_PUBLIC_API_URL=https://blaccsckull-assignment.onrender.com" > .env
npx expo start
```

Scan the QR code with Expo Go on Android or with the Camera app on iOS. The API runs on Render's free tier, so the first request can take up to a minute while it wakes up.

Log in with `demo@feedants.com` / `demo1234`, or sign up. Then open Competitions → Feedants Classical Dance. To test a payment, use the UPI ID `success@razorpay` or card `4111 1111 1111 1111` with any future expiry and any CVV.

**2. Backend locally as well**

The API needs a MongoDB replica set, because registration uses transactions. A free Atlas cluster works; a plain standalone `mongod` does not.

```bash
cd backend
npm install
cp .env.example .env   # set MONGODB_URI, JWT_SECRET and the Razorpay test keys
npm run seed           # sample competitions, testimonials and the demo user
npm run dev            # http://localhost:4000
```

Then follow step 1, setting `EXPO_PUBLIC_API_URL` to `http://<your computer's LAN IP>:4000`. A phone can't reach `localhost`.

**Tests:** run `cd backend && npm test`. They use an in-memory MongoDB, which downloads a `mongod` binary the first time.

## Environment

- `backend/.env`:
  - `MONGODB_URI` and `JWT_SECRET` (at least 16 characters) are required.
  - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are needed for paid entries.
  - Optional: `PUBLIC_BASE_URL`, `CORS_ORIGINS`, `HOLD_MINUTES` (default 10) and `REFERRAL_REWARD` (in paise, default 1000).
- `mobile/.env`: `EXPO_PUBLIC_API_URL`.

To deploy on Render, use `render.yaml`. Its settings are root directory `backend`, build `npm ci --include=dev && npm run build`, start `npm start`, and the Razorpay webhook goes to `/api/v1/webhooks/razorpay`.

## Decisions and trade-offs

- **No overbooking:** spots are taken with one conditional update (`bookedCount < capacity`) inside a transaction. A test has 50 users race for 20 spots, and exactly 20 get one.
- **Holds during payment:** an unpaid spot is held for 10 minutes and then released by a sweeper. A payment that arrives after its spot has gone is marked `refund_due`.
- **Payment confirmation:** it happens by a signature check in the app flow and, as a backup, through the webhook. Both are idempotent, so a duplicate does nothing.
- **Razorpay in a WebView:** checkout runs in a WebView page served by the API, so the app works in Expo Go without the native SDK.
- **Uploads in MongoDB:** videos go to GridFS, because Render's disk is wiped on every restart. At real scale they belong in S3 or R2.
- **Manual refresh:** the page never reloads on its own; you pull down to refresh. The spots count can be out of date until then, but the server always has the final say.
- **Server time for deadlines:** the countdown uses the server's clock, and the server decides the phase.

## Assumptions

- "Registered" means the fee has been paid.
- A user has one entry per competition, and re-uploading replaces it.
- Registration and submission windows can overlap, as they do in the design.
- The images are cropped from the design, and the videos are a sample clip.

## Next steps for production

- Presigned uploads to object storage.
- Automatic refunds for `refund_due` entries.
- Referral credit applied at checkout.
- Holds processed by a queue or worker instead of inside the API process.
- Refresh tokens.
- An admin panel for creating competitions.
- End-to-end tests for the app.
