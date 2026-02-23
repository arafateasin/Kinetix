# CryptoX — Professional Crypto Trading Dashboard

---

> **Software Integration and Improvement Assignment**
>
> | Field               | Details           |
> | ------------------- | ----------------- |
> | **Student Name**    | Easin Arafat      |
> | **Student ID**      | 202309010883      |
> | **Submission Date** | February 24, 2026 |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Software Integration Architecture](#2-software-integration-architecture)
3. [Integration Technique](#3-integration-technique)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [How to Run](#6-how-to-run)
7. [Features](#7-features)
8. [Verification Proof](#8-verification-proof)
9. [Environment Variables](#9-environment-variables)

---

## 1. Project Overview

**CryptoX** is a full-stack, Binance Pro-style cryptocurrency trading dashboard built with modern web technologies. It replicates the core functionality of a professional exchange interface — real-time price feeds, candlestick charts, an order book, a buy/sell execution terminal, live trade history, and a comprehensive markets overview page.

The platform integrates three distinct software systems:

- A **React/TypeScript frontend** for the user interface
- The **CoinGecko public market data API** (proxied through a Supabase Edge Function) as the live data source
- **Supabase (PostgreSQL + Realtime)** as the cloud database and backend-as-a-service layer

The result is a seamless, real-time trading simulation environment suitable for demonstrating modern software integration patterns.

---

## 2. Software Integration Architecture

The system follows a **three-tier integration architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│         React 18 + TypeScript + Vite (Port 8080)            │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐ │
│  │ TradingChart │ │  OrderBook   │ │   BuySellTerminal   │ │
│  │ (Candles)    │ │ (Prices)     │ │ (Trade Execution)   │ │
│  └──────┬───────┘ └──────┬───────┘ └──────────┬──────────┘ │
│         │                │                     │            │
└─────────┼────────────────┼─────────────────────┼────────────┘
          │                │    REST API calls    │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                          │
│            Supabase Edge Function (Deno Runtime)            │
│              /functions/v1/crypto-data                      │
│                                                             │
│   action=markets → CoinGecko /coins/markets                 │
│   action=candles → CoinGecko /coins/{id}/ohlc               │
│   action=price   → CoinGecko /simple/price                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP fetch (free public API)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   MARKET DATA SOURCE                        │
│                CoinGecko Public REST API                    │
│            https://api.coingecko.com/api/v3/                │
│         (Live prices, OHLC candles, market stats)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE LAYER                   │
│            Supabase (PostgreSQL + Realtime)                 │
│                                                             │
│  Tables:                                                    │
│  ├── user_wallets   (balance tracking)                      │
│  └── trade_history  (executed orders)                       │
│                                                             │
│  Realtime channels:                                         │
│  ├── wallet_changes  (live balance updates)                 │
│  └── trade_history_changes (live trade feed)               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. On page load, the React frontend calls the **Supabase Edge Function** via REST (HTTP GET with Bearer token auth).
2. The edge function forwards the request to the **CoinGecko API**, parses the response, and returns clean JSON.
3. The frontend renders the data in real-time charts, order books, and price tickers.
4. When a user places a trade, the frontend writes directly to **Supabase PostgreSQL** via the `@supabase/supabase-js` database driver.
5. Supabase **Realtime WebSocket channels** push database changes instantly back to all connected clients (wallet balance updates, new trade entries).

---

## 3. Integration Technique

This project explicitly uses two standard software integration techniques:

### ① REST API Integration

| Property            | Details                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| **Protocol**        | HTTP/HTTPS                                                                              |
| **Method**          | GET requests with query parameters                                                      |
| **Auth**            | Bearer token (Supabase anon key) in `Authorization` header                              |
| **Data Format**     | JSON                                                                                    |
| **Endpoint base**   | `https://<project>.supabase.co/functions/v1/crypto-data`                                |
| **Parameters**      | `?action=markets`, `?action=price&coin=bitcoin`, `?action=candles&coin=bitcoin&days=90` |
| **External source** | CoinGecko Public API v3                                                                 |

Example REST call made by the frontend:

```http
GET https://ihkcsrqdrcsuvmhpitmv.supabase.co/functions/v1/crypto-data?action=price&coin=bitcoin
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ② Database Driver Integration

| Property            | Details                                              |
| ------------------- | ---------------------------------------------------- |
| **Driver / Client** | `@supabase/supabase-js` v2                           |
| **Database**        | PostgreSQL (hosted on Supabase cloud)                |
| **ORM style**       | Query builder (`.from().select().insert().update()`) |
| **Realtime**        | WebSocket-based Supabase Realtime channels           |
| **Tables accessed** | `user_wallets`, `trade_history`                      |

Example database driver call:

```typescript
const { data, error } = await supabase
  .from("trade_history")
  .insert({ asset: "BTC", amount: 0.5, price: 64472, side: "buy" });
```

---

## 4. Technology Stack

| Layer              | Technology                       | Version   |
| ------------------ | -------------------------------- | --------- |
| Frontend Framework | React                            | 18.3.1    |
| Language           | TypeScript                       | 5.8.3     |
| Build Tool         | Vite                             | 5.4.19    |
| UI Components      | shadcn/ui + Radix UI             | Latest    |
| Styling            | Tailwind CSS                     | 3.4.17    |
| Routing            | React Router DOM                 | 6.30.1    |
| Server State       | TanStack Query                   | 5.83.0    |
| Charts             | lightweight-charts (TradingView) | 5.1.0     |
| Icons              | Lucide React                     | 0.462.0   |
| Database Client    | @supabase/supabase-js            | 2.97.0    |
| Backend / DB       | Supabase (PostgreSQL + Realtime) | Cloud     |
| Edge Functions     | Deno Runtime (Supabase)          | —         |
| Market Data API    | CoinGecko Public API v3          | Free tier |
| Testing            | Vitest                           | 3.2.4     |

---

## 5. Project Structure

```
crypto-nexus-hub/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx          # Public landing page (/)
│   │   ├── Index.tsx            # Main trading terminal (/trade)
│   │   ├── Markets.tsx          # Full markets overview (/markets)
│   │   └── Futures.tsx          # Futures preview page (/futures)
│   ├── components/
│   │   ├── TopNavBar.tsx        # Navigation with wallet balance
│   │   ├── TradingChart.tsx     # Candlestick chart (lightweight-charts)
│   │   ├── OrderBook.tsx        # Live order book display
│   │   ├── BuySellTerminal.tsx  # Trade execution form
│   │   ├── MarketsList.tsx      # Left-panel market list
│   │   └── TradeHistory.tsx     # Real-time trade history feed
│   ├── contexts/
│   │   └── MarketContext.tsx    # Global selected coin state
│   └── integrations/
│       └── supabase/
│           ├── client.ts        # Supabase JS client initialisation
│           └── types.ts         # Auto-generated database types
├── supabase/
│   ├── functions/
│   │   └── crypto-data/
│   │       └── index.ts         # Edge Function (Deno) → CoinGecko proxy
│   └── migrations/              # PostgreSQL schema migrations
├── .env                         # Environment variables (not committed)
└── package.json
```

---

## 6. How to Run

### Prerequisites

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** v9 or higher (bundled with Node.js)
- A modern browser (Chrome, Edge, Firefox)

### Step-by-Step Setup

**Step 1 — Clone the repository**

```bash
git clone <YOUR_GIT_URL>
cd crypto-nexus-hub
```

**Step 2 — Install dependencies**

```bash
npm install
```

**Step 3 — Configure environment variables**

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PROJECT_ID=<your-project-id>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

> The Supabase anon key is safe to expose in the browser. Row Level Security (RLS) enforces access control at the database level.

**Step 4 — Start the development server**

```bash
npm run dev
```

The app will be available at **http://localhost:8080**

**Step 5 — Build for production**

```bash
npm run build
```

Output is placed in the `dist/` directory and can be served by any static host.

**Step 6 — Run tests**

```bash
npm test
```

### Available Pages

| URL                             | Description           |
| ------------------------------- | --------------------- |
| `http://localhost:8080/`        | Landing page          |
| `http://localhost:8080/trade`   | Full trading terminal |
| `http://localhost:8080/markets` | Live markets overview |
| `http://localhost:8080/futures` | Futures preview       |

---

## 7. Features

- **Landing Page** — Hero section with live price tickers, feature highlights, and statistics
- **Trading Terminal** — Binance Pro-style layout with chart, order book, trade history, and buy/sell form
- **Live Candlestick Chart** — TradingView-powered OHLC chart with multiple time intervals (1m → 1W)
- **Real-Time Order Book** — Simulated bid/ask spread with live price feed
- **Buy / Sell Terminal** — Market and limit order placement with wallet balance validation
- **Markets Page** — Sortable, searchable table of 20+ coins with price, 24h change, volume, and market cap
- **Futures Page** — Coming-soon page with upcoming pair preview and feature listing
- **Real-Time Wallet Balance** — Live balance updates via Supabase Realtime WebSocket
- **Trade History Feed** — Live-updating trade log via PostgreSQL Realtime subscriptions
- **Favorites** — Star coins across the Markets page and sidebar panel
- **Active Route Highlighting** — Navigation highlights the current page

---

## 8. Verification Proof

Data exchange between all three integrated systems has been verified using the following methods:

### REST API Verification (Browser Network Logs)

1. Open the app at `http://localhost:8080/trade`
2. Open **DevTools → Network → Fetch/XHR**
3. Observe outgoing requests to:
   - `https://ihkcsrqdrcsuvmhpitmv.supabase.co/functions/v1/crypto-data?action=price&coin=bitcoin`
   - `https://ihkcsrqdrcsuvmhpitmv.supabase.co/functions/v1/crypto-data?action=markets`
   - `https://ihkcsrqdrcsuvmhpitmv.supabase.co/functions/v1/crypto-data?action=candles&coin=bitcoin&days=90`
4. Each returns **HTTP 200** with a JSON payload containing live market data sourced from CoinGecko — confirming the REST API integration is active.

### Database Driver Verification (Supabase Dashboard)

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Table Editor → trade_history**
3. Place a buy/sell order in the CryptoX trading terminal
4. Refresh the table — the new row appears instantly, confirming the `@supabase/supabase-js` driver successfully wrote to PostgreSQL via the database driver integration.

### Realtime Subscription Verification (Live UI Updates)

1. Open two browser tabs at `http://localhost:8080/trade`
2. Place a trade in Tab 1
3. The **Trade History** panel in **Tab 2** updates in real-time without any page refresh — confirming the Supabase Realtime WebSocket channel (`trade_history_changes`) is operating correctly and pushing live database events to all subscribers.

---

## 9. Environment Variables

| Variable                        | Description                     | Required |
| ------------------------------- | ------------------------------- | -------- |
| `VITE_SUPABASE_URL`             | Full Supabase project URL       | ✅       |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project ID (subdomain) | ✅       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key        | ✅       |

> **Note:** The CoinGecko free public API requires no API key. All market data requests are proxied through the Supabase Edge Function to avoid CORS issues and to keep data fetching server-side.

---

_CryptoX — Software Integration and Improvement Assignment | Student ID: 202309010883 | Easin Arafat_
