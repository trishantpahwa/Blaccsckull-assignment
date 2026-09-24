# Feedants – Competition Details

The competition details screen from the Feedants design, built as a working feature: a React Native (Expo) app in `mobile/` and an Express + MongoDB API in `backend/`. Everything on the screen comes from the API, including spots left, dates, the countdown and the state of the bottom button. Registration takes the entry fee through Razorpay (test mode), and registered users can upload a video entry. Signed-in users can post their own competition from the + tab (`POST /api/v1/competitions`).

Beyond the design, the app also has:

- **People's Choice showcase:** once submissions open, anyone can watch the entries and signed-in users can vote for their favourites. A leaderboard puts the top three on a podium, and tied entries share a rank (1, 2, 2, 4). Entrants can hide their video from the showcase, and judges still see it.
- **Saved competitions:** bookmark a competition from its header to find it again in your profile.
- **My competitions:** your profile lists every competition you've joined, with payment status, whether your video is uploaded and how many votes it has.
- **Sharing:** the share button sends a link to `/c/<slug>`, a small public page that shows a preview in chat apps and opens the app.

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

Log in with `demo@feedants.com` / `demo1234`, or sign up. Then open Competitions → Feedants Classical Dance, and tap People's Choice to see the seeded entries and vote. To test a payment, use the UPI ID `success@razorpay` or card `4111 1111 1111 1111` with any future expiry and any CVV.

**2. Backend locally as well**

The API needs a MongoDB replica set, because registration uses transactions. A free Atlas cluster works; a plain standalone `mongod` does not.

```bash
cd backend
npm install
cp .env.example .env   # set MONGODB_URI, JWT_SECRET and the Razorpay test keys
npm run seed           # sample competitions, showcase entries with votes, testimonials and the demo user
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
- **Votes can't be double-counted:** a vote is a row with a unique `(entry, user)` index, and the entry's `voteCount` is updated in the same transaction. A repeated or concurrent vote hits the index and does nothing, so voting is idempotent. The API uses `PUT` and `DELETE` rather than a toggle, so a retried request can't flip a vote back. Tests fire 10 simultaneous votes from one user (count stays 1) and have 15 users vote while 5 remove theirs (count ends at 10).
- **Voting rules:** voting runs from the start of submissions until results are out. You can't vote for your own entry, and hidden entries can't receive votes. Votes stay with the entry when its video is replaced.
- **Leaderboard stays put:** the app updates a vote on screen immediately and rolls it back if the request fails. It doesn't re-sort the list while you're voting, so rows don't jump around. Pull down to refresh the ranking.
- **Video streaming:** entry videos are served with HTTP Range support (`206 Partial Content`), because iOS won't play an MP4 without it. Each video URL includes its file id, so it can be cached publicly and a replaced video gets a new URL.
- **Privacy in the showcase:** the public gallery shows first name and last initial only ("Riya S.").
- **Posting competitions:** the server validates each post. Dates must run in order, registration must close in the future and submissions can't end before registration closes. There can't be more rewards than spots, and rewards can't grow down the list. The prize pool is the sum of the rewards, and the slug gets a random suffix so identical titles don't clash.

## Assumptions

- "Registered" means the fee has been paid.
- A user has one entry per competition, and re-uploading replaces it.
- Registration and submission windows can overlap, as they do in the design.
- The images are cropped from the design, and the videos are a sample clip.
- Any signed-in user can post a competition, and it goes live immediately. Posted content is English only, so the Hindi view shows it in English.

## Next steps for production

- Presigned uploads to object storage.
- Automatic refunds for `refund_due` entries.
- Referral credit applied at checkout.
- Holds processed by a queue or worker instead of inside the API process.
- Refresh tokens.
- Moderation or approval before a posted competition goes live, plus editing and cancelling.
- Moderation and reporting for showcase entries, and limits on votes from brand-new accounts.
- Paginating the entries list past 100.
- End-to-end tests for the app.
