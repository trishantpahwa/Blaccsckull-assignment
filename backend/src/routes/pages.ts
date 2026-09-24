import path from 'node:path';
import { Router } from 'express';
import { competitionLink } from '../lib/urls';
import { CompetitionModel } from '../models/Competition';
import { getLifecycle } from '../services/lifecycle';

const publicDir = path.resolve(__dirname, '../../public');

export const pagesRouter = Router();

pagesRouter.get('/checkout', (_req, res) => {
  res.sendFile(path.join(publicDir, 'checkout.html'));
});

pagesRouter.get('/r/:code', (req, res) => {
  const code = String(req.params.code).replace(/[^A-Za-z0-9]/g, '').slice(0, 16).toUpperCase();
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Join Feedants</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f4f8f8; color: #12302f; display: grid; place-items: center; min-height: 100vh; margin: 0; }
  main { background: #fff; padding: 32px 24px; border-radius: 16px; max-width: 360px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.06); }
  code { display: inline-block; margin-top: 8px; font-size: 22px; letter-spacing: 3px; color: #0e6e6e; }
</style>
</head>
<body>
<main>
  <h1>You're invited to Feedants</h1>
  <p>Open the Feedants app, sign up and enter this referral code:</p>
  <code>${code}</code>
</main>
</body>
</html>`);
});

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const istDate = (date: Date) =>
  date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// Landing page for shared competition links: unfurls nicely in chat apps and hands off to the app.
pagesRouter.get('/c/:slug', async (req, res) => {
  const slug = String(req.params.slug).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80);
  const c = await CompetitionModel.findOne({ slug, status: { $in: ['published', 'cancelled'] } }).lean();
  if (!c) {
    res.status(404).type('html').send('<!doctype html><title>Not found</title><p>This competition could not be found.</p>');
    return;
  }

  const { phase, isFull } = getLifecycle(c);
  const spotsLeft = Math.max(c.capacity - c.bookedCount, 0);
  const title = escapeHtml(c.title.en);
  const summary = escapeHtml(
    `${c.category.en} competition judged by ${c.judge.name}. Prize pool ${rupees(c.prizePool)}, entry ${c.entryFee ? rupees(c.entryFee) : 'free'}.`,
  );
  const status =
    phase === 'registration_open' && !isFull
      ? `${spotsLeft} of ${c.capacity} spots left · registration closes ${istDate(c.schedule.registrationClosesAt)} IST`
      : phase === 'upcoming'
        ? `Registration opens ${istDate(c.schedule.registrationOpensAt)} IST`
        : phase === 'cancelled'
          ? 'This competition has been cancelled'
          : 'Registration is closed. Open the app to watch the entries.';

  res.set('Cache-Control', 'public, max-age=60');
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Feedants</title>
<meta name="description" content="${summary}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Feedants">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${summary}">
<meta property="og:url" content="${escapeHtml(competitionLink(c.slug))}">
<meta name="twitter:card" content="summary">
<style>
  body { font-family: system-ui, sans-serif; background: #f4f8f8; color: #1e2641; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 16px; box-sizing: border-box; }
  main { background: #fff; padding: 28px 24px; border-radius: 16px; max-width: 380px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,.06); }
  .tag { display: inline-block; background: #edf7f7; color: #03717b; font-size: 13px; padding: 4px 10px; border-radius: 6px; }
  h1 { margin: 12px 0 4px; font-size: 24px; }
  .muted { color: #67708f; margin: 0; }
  .stats { display: flex; gap: 24px; margin: 20px 0; }
  .stats b { display: block; font-size: 22px; color: #03717b; }
  .status { background: #f6f8fa; border-radius: 10px; padding: 10px 12px; font-size: 14px; }
  a.cta { display: block; margin-top: 20px; text-align: center; background: #03717b; color: #fff; text-decoration: none; font-weight: 600; padding: 14px; border-radius: 10px; }
</style>
</head>
<body>
<main>
  <span class="tag">${escapeHtml(c.category.en)}</span>
  <h1>${title}</h1>
  <p class="muted">Judge: ${escapeHtml(c.judge.name)}</p>
  <div class="stats">
    <div><b>${rupees(c.prizePool)}</b><span class="muted">Prize pool</span></div>
    <div><b>${c.entryFee ? rupees(c.entryFee) : 'Free'}</b><span class="muted">Entry fee</span></div>
  </div>
  <div class="status">${escapeHtml(status)}</div>
  <a class="cta" href="feedants://competitions/${c.slug}">Open in Feedants</a>
</main>
</body>
</html>`);
});
