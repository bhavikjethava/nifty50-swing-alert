# Nifty50 Swing Alert

Production-ready Next.js app for monitoring Nifty 50 stocks and generating informational swing-trading alerts from free RSS news plus Yahoo Finance technical data. It does not execute trades.

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives
- SQLite with Prisma ORM
- `yahoo-finance2` for daily OHLCV data
- RSS feeds from Economic Times, Moneycontrol, and Google News stock searches
- Keyword sentiment engine
- `node-cron` worker for Railway/Render
- Telegram Bot API notifications, with optional Nodemailer fallback
- TradingView Lightweight Charts
- Vitest unit tests for strategy logic

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Create the SQLite database and seed Nifty 50 stocks:

```bash
npm run prisma:migrate
npm run prisma:seed
```

4. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scanner Commands

Manual scans are useful during development:

```bash
npm run scan:news
npm run scan:technicals
npm run send-alerts
```

The worker mode runs news scanning every 15 minutes and technical scanning every 30 minutes during Indian market hours:

```bash
npm run worker
```

## API Endpoints

- `GET /api/stocks`
- `GET /api/news`
- `GET /api/alerts`
- `POST /api/scan/news`
- `POST /api/scan/technicals`
- `POST /api/send-alerts`

If `SCAN_SECRET` is set, scanner endpoints require either:

```bash
x-scan-secret: your-secret
```

or `?secret=your-secret`.

## Alert Logic

Bullish technical setup:

- EMA20 > EMA50 > EMA200
- Current price above EMA200
- Price within 2% of EMA20
- Current volume > 1.5 x 20-day average volume

Bearish technical setup:

- EMA20 < EMA50 < EMA200
- Current price below EMA200

An alert is generated only when the latest technical setup aligns with matching sentiment news from the last 24 hours. Duplicate stock alerts are blocked for 24 hours.

## Telegram Setup

1. Create a bot with BotFather.
2. Add `TELEGRAM_BOT_TOKEN` to `.env`.
3. Send a message to your bot.
4. Retrieve your chat id and set `TELEGRAM_CHAT_ID`.
5. Run:

```bash
npm run send-alerts
```

## Deployment

### Vercel

Deploy the Next.js frontend and API routes. Use Vercel Cron or an external scheduler to call:

- `POST /api/scan/news`
- `POST /api/scan/technicals`
- `POST /api/send-alerts`

SQLite files are not persistent on serverless platforms. For production persistence on Vercel, use a hosted SQLite-compatible option such as Turso, or run the app plus worker on a persistent host.

### Railway or Render

Run the web service with:

```bash
npm start
```

Run the cron worker as a separate service with:

```bash
npm run worker
```

The included `Dockerfile` builds the Next.js application. Make sure the database path is mounted on persistent storage if using SQLite.

## Tests

```bash
npm test
```

## Market Data Sources

Daily OHLCV is fetched with a three-tier fallback so a single source outage does not stop scans:

1. `yahoo-finance2` library (primary)
2. Yahoo's public chart endpoint via direct fetch — sidesteps the library's crumb/cookie rate limit
3. Yahoo chart via the free `r.jina.ai` reader proxy — the request originates from the proxy's (unblocked) servers, so it works even when the local IP is rate-limited. No API key required.
4. Twelve Data (optional) — set `TWELVE_DATA_API_KEY`. Note: NSE/Indian equities require a paid Twelve Data plan, so this tier only helps for US symbols.

Candle responses are cached per symbol for 6 hours so the dashboard's 5-minute auto-refresh does not re-hit the data sources and trip rate limits.

## Important Constraints

- Uses free data sources only.
- Does not place orders or integrate with broker execution.
- Alerts are informational and require manual chart review before any trading decision.
