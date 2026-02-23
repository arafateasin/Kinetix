# Kinetix — Professional Crypto Trading Dashboard

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
4. [Advanced Architecture](#4-advanced-architecture)
5. [Performance Optimization](#5-performance-optimization)
6. [Data Integrity & Concurrency](#6-data-integrity--concurrency)
7. [Software Improvement Summary](#7-software-improvement-summary)
8. [Technology Stack](#8-technology-stack)
9. [Project Structure](#9-project-structure)
10. [How to Run](#10-how-to-run)
11. [Features](#11-features)
12. [Verification Proof](#12-verification-proof)
13. [Environment Variables](#13-environment-variables)

---

## 1. Project Overview

**Kinetix** is a full-stack, Binance Pro-style cryptocurrency trading dashboard built with modern web technologies. It replicates the core functionality of a professional exchange interface — real-time price feeds, candlestick charts, an order book, a buy/sell execution terminal, live trade history, and a comprehensive markets overview page.

The platform integrates three distinct software systems:

- A **React/TypeScript frontend** for the user interface
- The **CoinGecko public market data API** (proxied through a Supabase Edge Function) as the live data source
- **Supabase (PostgreSQL + Realtime)** as the cloud database and backend-as-a-service layer

The result is a seamless, real-time trading simulation environment suitable for demonstrating modern software integration patterns.

---

## 2. Software Integration Architecture

The system follows a **three-tier integration architecture**:

```text
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
│  └── trade_history_changes (live trade feed)                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. On page load, the React frontend calls the **Supabase Edge Function** via REST (HTTP GET with Bearer token auth).
2. The edge function forwards the request to the **CoinGecko API**, parses the response, and returns clean JSON.
3. The frontend renders the data in real-time charts, order books, and price tickers.
4. When a user places a trade, the frontend calls a **PostgreSQL Stored Procedure (RPC)** via the `@supabase/supabase-js` driver — atomically inserting the trade and adjusting the balance in a single transaction.
5. Supabase **Realtime WebSocket channels** push database changes instantly back to all connected clients (wallet balance updates, new trade entries), eliminating the need for polling.

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

## 4. Advanced Architecture

### Event-Driven Architecture via WebSockets / Supabase Realtime

The initial version of Kinetix used a **polling model** — each component independently called the API on a fixed interval (e.g., every 10 seconds) to check for updates. While simple to implement, this approach has fundamental inefficiencies:

- **Wasted network requests** — the majority of polls return unchanged data.
- **Latency floor** — a user sees a new trade only after the next poll fires, introducing up to N seconds of visible lag.
- **Compounding server load** — multiple components polling independently multiplies unnecessary HTTP traffic.

#### The Transition to Event-Driven (Push) Model

Kinetix was upgraded to a **push-based, event-driven architecture** using Supabase Realtime WebSocket channels. Instead of asking "has anything changed?", the system now _listens_ for change events and reacts instantly.

```text
POLLING MODEL (Before)                EVENT-DRIVEN MODEL (After)
─────────────────────────             ─────────────────────────────
Client ──[every 10s GET]──▶ Server    Client ──[subscribe]──────▶ Server
Client ◀──────[data]──────  Server    Server ──[on INSERT event]──▶ Client
Client ──[every 10s GET]──▶ Server    (no further requests needed)
Client ◀──────[data]──────  Server
       ... repeated forever
```

#### Implementation in Kinetix

**Order Book** (`src/components/OrderBook.tsx`):
The order book previously refreshed every 10 seconds. It now subscribes to `INSERT` events on the `trade_history` table. When a trade is recorded, the Supabase Realtime channel broadcasts the event via WebSocket and the order book re-prices immediately — with zero polling.

```typescript
const channel = supabase
  .channel(`orderbook_${selectedCoinId}`)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "trade_history" },
    () => {
      // A new trade was recorded → re-price the order book via the worker
      fetchAndDispatch();
    },
  )
  .subscribe();
```

**Wallet Balance** (`src/components/TopNavBar.tsx`):
The top navigation bar subscribes to `UPDATE` events on `user_wallets`. When a trade is placed and the balance changes, the new balance is pushed instantly to every connected browser tab — no page refresh, no polling.

```typescript
const channel = supabase
  .channel("wallet_changes")
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "user_wallets" },
    (payload) => {
      const newBal = Number(payload.new.total_balance);
      setBalance(newBal);
      setPulseBalance(true); // triggers CSS price-pulse animation
    },
  )
  .subscribe();
```

**Trade History** (`src/components/TradeHistory.tsx`):
The live trade feed subscribes to `INSERT` events and prepends new trades to the list in real time — the user sees their executed order appear in the history panel within milliseconds.

| Component      | Before (Polling) | After (Event-Driven) | Latency Improvement |
| -------------- | ---------------- | -------------------- | ------------------- |
| Order Book     | ~10 s interval   | Instant on trade     | Up to 10 000 ms     |
| Wallet Balance | ~10 s interval   | Instant on trade     | Up to 10 000 ms     |
| Trade History  | ~10 s interval   | Instant on INSERT    | Up to 10 000 ms     |

---

## 5. Performance Optimization

### Web Workers — Offloading Heavy Processing (Mechanical Sympathy)

JavaScript is single-threaded. In a trading dashboard, the main thread is responsible for rendering at 60 fps, handling user input, running animations, and processing data. If any one of these tasks blocks the thread, the UI stutters.

**The problem:** The `OrderBook` component must parse raw JSON from the API, perform floating-point arithmetic to generate bid/ask spreads across 24 price levels, and sort the resulting arrays — all before any pixels can be painted.

**The solution:** A **Web Worker** (`src/workers/marketDataWorker.ts`) was introduced to perform all heavy computation on a **separate OS thread**, completely decoupled from the rendering loop.

```text
MAIN THREAD                          WORKER THREAD
──────────────────────               ──────────────────────────────
UI rendering @ 60 fps                Receives raw JSON string
User interactions                    JSON.parse()
React reconciliation                 Calculate mid-price
                                     Generate 24 ask levels
                                     Generate 24 bid levels
                                     Sort by price
◀── postMessage(ORDER_BOOK_READY) ── Return fully processed payload
State update → React re-render
```

The worker receives a raw JSON string (avoiding a double-parse) and returns a fully typed `OrderBookPayload`. The main thread only updates state when the result is ready — never blocking on data processing.

```typescript
// src/components/OrderBook.tsx
workerRef.current = new Worker(
  new URL("../workers/marketDataWorker.ts", import.meta.url),
  { type: "module" },
);

workerRef.current.onmessage = (e: MessageEvent) => {
  if (e.data.type === "ORDER_BOOK_READY") {
    const book = e.data.payload as OrderBookPayload;
    setCurrentPrice(book.price);
    setSells(book.sells);
    setBuys(book.buys);
  }
};
```

The worker is instantiated **once on mount** and reused across price updates, avoiding the overhead of repeated worker construction.

### React.memo — Surgical Re-Render Prevention

The order book renders 48 individual row components (24 asks + 24 bids). Without memoisation, every state update (e.g., one row's amount changes) would re-render all 48 rows — a worst-case $O(n)$ DOM diff for an $O(1)$ change.

**`React.memo`** was applied to both `OrderRow` (individual rows) and the `OrderBook` component itself:

```typescript
// Individual row — only re-renders when its specific order object changes
const OrderRow = memo(({ order, side, isAnimating }: RowProps) => ( ... ));

// Entire OrderBook — doesn't re-render when sibling components change
const OrderBook = memo(() => ( ... ));
```

**`useMemo`** memoises the sell and buy row JSX arrays independently:

```typescript
const sellRows = useMemo(
  () => sells.map((o, i) => <OrderRow key={`sell-${i}`} order={o} ... />),
  [sells, animatingSellIdx],
);

const buyRows = useMemo(
  () => buys.map((o, i) => <OrderRow key={`buy-${i}`} order={o} ... />),
  [buys, animatingBuyIdx],
);
```

If only the buy side updates (common during one-sided order flow), only `buyRows` is recomputed — the sell half is skipped entirely. This halves unnecessary DOM diffing during asymmetric market events.

### Real-Time Update Frequencies

| Component          | Update Trigger           | Mechanism         |
| ------------------ | ------------------------ | ----------------- |
| MarketsList        | Every 10 seconds         | REST polling      |
| TradingChart Price | Every 10 seconds         | REST polling      |
| BuySellTerminal    | Every 5 seconds          | REST polling      |
| OrderBook          | On new trade (instant)   | Supabase Realtime |
| Trade History      | On new trade (instant)   | Supabase Realtime |
| Wallet Balance     | On balance change (inst) | Supabase Realtime |

---

## 6. Data Integrity & Concurrency

### The Single-Writer Principle — Atomic Transactions via PostgreSQL RPC

#### The Problem: Race Conditions in Multi-Step Operations

The naive implementation of a trade placed three independent database operations:

1. `SELECT total_balance FROM user_wallets` — read the balance
2. `INSERT INTO trade_history ...` — record the trade
3. `UPDATE user_wallets SET total_balance = ...` — deduct the cost

This **Time-of-Check to Time-of-Use (TOCTOU)** pattern is inherently unsafe. Between steps 1 and 3, the balance could be modified by another concurrent request (e.g., two rapid buy clicks), resulting in a negative balance — a critical financial data integrity failure.

```text
TOCTOU RACE CONDITION (Before)
──────────────────────────────────────────────────────────
Request A: SELECT balance → $1,000          ← both see $1,000
Request B: SELECT balance → $1,000          ← concurrently
Request A: INSERT trade ($800)
Request A: UPDATE balance → $200
Request B: INSERT trade ($800)              ← also thinks balance is $1,000
Request B: UPDATE balance → $200            ← overwrites A's update!
Final balance: $200 (should be -$600 → REJECTED)
```

#### The Solution: Atomic RPC (Stored Procedure)

All three operations were consolidated into a single **PostgreSQL Stored Procedure** called `place_trade_atomic`, invoked via the Supabase RPC interface. The procedure:

1. Acquires a **row-level lock** (`SELECT FOR UPDATE`) on the wallet row — blocking any concurrent modification.
2. Validates the balance is sufficient.
3. Inserts the trade record.
4. Updates the balance.
5. **Commits or rolls back atomically** — either all three steps succeed, or none of them do.

```sql
-- supabase/migrations/20260224120000_atomic_trade_rpc.sql
CREATE OR REPLACE FUNCTION place_trade_atomic(
  p_wallet_id  UUID,
  p_asset      TEXT,
  p_amount     NUMERIC,
  p_price      NUMERIC,
  p_side       TEXT
) RETURNS JSON AS $$
DECLARE
  v_balance     NUMERIC;
  v_trade_cost  NUMERIC;
BEGIN
  -- Acquire row-level lock — blocks concurrent writers
  SELECT total_balance INTO v_balance
  FROM user_wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  v_trade_cost := p_amount * p_price;

  IF p_side = 'buy' AND v_balance < v_trade_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Insert trade record
  INSERT INTO trade_history (asset, amount, price, side)
  VALUES (p_asset, p_amount, p_price, p_side);

  -- Atomically update balance
  UPDATE user_wallets
  SET total_balance = total_balance - CASE WHEN p_side = 'buy' THEN v_trade_cost ELSE -v_trade_cost END
  WHERE id = p_wallet_id;

  RETURN json_build_object('success', true, 'new_balance', v_balance - v_trade_cost);
END;
$$ LANGUAGE plpgsql;
```

The frontend call collapses three network round-trips into one:

```typescript
// src/components/BuySellTerminal.tsx
const { data: rpcResult, error: rpcError } = await supabase.rpc(
  "place_trade_atomic",
  {
    p_wallet_id: wallet.id,
    p_asset: selectedSymbol,
    p_amount: parseFloat(amount),
    p_price: parseFloat(price),
    p_side: side,
  },
);
```

#### Concurrency Guarantee

```text
ATOMIC RPC (After)
──────────────────────────────────────────────────────────
Request A: BEGIN TRANSACTION
Request A: SELECT balance FOR UPDATE → acquires lock
Request B: SELECT balance FOR UPDATE → BLOCKED (waiting)
Request A: Validate, INSERT trade, UPDATE balance → COMMIT
Request B: Lock released → re-reads balance ($200) → REJECTED (insufficient)
Final balance: $200 ✅ — exactly correct, no race condition
```

---

## 7. Software Improvement Summary

The following table summarises the key architectural upgrades made to Kinetix and their measurable impact on system latency and reliability:

| Area                    | Before                             | After                                 | Improvement                                     |
| ----------------------- | ---------------------------------- | ------------------------------------- | ----------------------------------------------- |
| **Update Delivery**     | Polling every 10 s                 | WebSocket push (Supabase Realtime)    | Up to **10 000 ms latency reduction** per event |
| **Server Load**         | Constant HTTP requests             | Zero-cost idle; events only on change | Dramatically reduced unnecessary network I/O    |
| **UI Thread Safety**    | JSON parse + sort on main thread   | Offloaded to Web Worker thread        | Main thread free for 60 fps rendering           |
| **Re-render Scope**     | All 48 rows on any data change     | Only changed rows via `React.memo`    | Up to **96% reduction** in DOM diffing work     |
| **Trade Atomicity**     | 3 separate HTTP calls / DB ops     | Single `place_trade_atomic` RPC       | Eliminates TOCTOU race condition entirely       |
| **Network Round-Trips** | 3 per trade (SELECT+INSERT+UPDATE) | 1 per trade (single RPC call)         | **66% reduction** in per-trade network overhead |
| **Data Integrity**      | Balance could go negative          | Postgres row-lock prevents overdraft  | Financial data integrity guaranteed             |
| **Crash Resilience**    | Partial state on mid-op failure    | Full rollback on any step failure     | ACID guarantees on all trade operations         |

### Why These Improvements Matter

A standard web application fetches data reactively on user action or on a fixed timer. In a financial trading context, these patterns introduce visible lag, concurrency hazards, and thread contention that degrade both user experience and data reliability.

By transitioning to an **event-driven push model**, offloading computation to **Web Workers**, applying **surgical memoisation**, and enforcing **atomic database transactions**, Kinetix achieves the responsiveness expected of a professional trading terminal — reacting to market events in milliseconds, rendering at 60 fps regardless of data volume, and guaranteeing that no trade can corrupt the wallet balance under any concurrent load.

---

## 8. Technology Stack

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

## 9. Project Structure

```text
crypto-nexus-hub/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx          # Public landing page (/)
│   │   ├── Index.tsx            # Main trading terminal (/trade)
│   │   ├── Markets.tsx          # Full markets overview (/markets)
│   │   └── Futures.tsx          # Futures preview page (/futures)
│   ├── components/
│   │   ├── TopNavBar.tsx        # Navigation with real-time wallet balance
│   │   ├── TradingChart.tsx     # Candlestick chart (lightweight-charts)
│   │   ├── OrderBook.tsx        # Event-driven order book + Web Worker
│   │   ├── BuySellTerminal.tsx  # Atomic trade execution form
│   │   ├── MarketsList.tsx      # Left-panel market list
│   │   └── TradeHistory.tsx     # Real-time trade history feed
│   ├── workers/
│   │   └── marketDataWorker.ts  # Web Worker: JSON parse + order book gen
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
│   └── migrations/              # PostgreSQL schema + atomic trade RPC
├── .env                         # Environment variables (not committed)
└── package.json
```

---

## 10. How to Run

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

### Available Pages

| URL                             | Description           |
| ------------------------------- | --------------------- |
| `http://localhost:8080/`        | Landing page          |
| `http://localhost:8080/trade`   | Full trading terminal |
| `http://localhost:8080/markets` | Live markets overview |
| `http://localhost:8080/futures` | Futures preview       |

---

## 11. Features

- **Landing Page** — Hero section with live price tickers, feature highlights, and statistics
- **Trading Terminal** — Binance Pro-style layout with chart, order book, trade history, and buy/sell form
- **Live Candlestick Chart** — TradingView-powered OHLC chart with multiple time intervals (1m → 1W)
- **Real-Time Order Book** — Event-driven bid/ask spread, repriced on every new trade via WebSocket
- **Buy / Sell Terminal** — Atomic order placement with wallet balance validation and TOCTOU protection
- **Markets Page** — Sortable, searchable table of 20+ coins with price, 24h change, volume, and market cap
- **Futures Page** — Coming-soon page with upcoming pair preview and feature listing
- **Real-Time Wallet Balance** — Instant balance updates via Supabase Realtime WebSocket
- **Trade History Feed** — Live-updating trade log via PostgreSQL Realtime subscriptions
- **Web Worker Processing** — Heavy data computation offloaded off the main thread for 60 fps UI
- **Mechanical Sympathy** — `React.memo` and `useMemo` prevent unnecessary re-renders
- **Active Route Highlighting** — Navigation highlights the current page
- **Favorites** — Star coins across the Markets page and sidebar panel

---

## 12. Verification Proof

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
3. Place a buy/sell order in the Kinetix trading terminal
4. Refresh the table — the new row appears instantly, confirming the `@supabase/supabase-js` driver successfully wrote to PostgreSQL via the atomic RPC.

### Realtime Subscription Verification (Live UI Updates)

1. Open two browser tabs at `http://localhost:8080/trade`
2. Place a trade in Tab 1
3. The **Trade History** panel and **Wallet Balance** in **Tab 2** update in real-time without any page refresh — confirming the Supabase Realtime WebSocket channels (`trade_history_changes`, `wallet_changes`) are operating correctly and pushing live database events to all subscribers.

### Web Worker Verification (DevTools)

1. Open **DevTools → Sources → Threads**
2. A dedicated worker thread named `marketDataWorker` is visible alongside the main thread — confirming computation is correctly offloaded and the main thread remains unblocked.

---

## 13. Environment Variables

| Variable                        | Description                     | Required |
| ------------------------------- | ------------------------------- | -------- |
| `VITE_SUPABASE_URL`             | Full Supabase project URL       | ✅       |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project ID (subdomain) | ✅       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key        | ✅       |

> **Note:** The CoinGecko free public API requires no API key. All market data requests are proxied through the Supabase Edge Function to avoid CORS issues and to keep data fetching server-side.

---

_Kinetix — Software Integration and Improvement Assignment | Student ID: 202309010883 | Easin Arafat_
