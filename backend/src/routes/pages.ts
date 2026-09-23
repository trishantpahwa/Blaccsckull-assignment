import path from 'node:path';
import { Router } from 'express';

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
