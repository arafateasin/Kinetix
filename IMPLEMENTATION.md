# Kinetix — Full Implementation Reference

## Overview

Kinetix (crypto-nexus-hub) is a full-stack cryptocurrency trading platform built with React, TypeScript, Vite, Tailwind CSS, and Supabase. It provides a professional trading terminal, live market data, order management, trade history, and a futures coming-soon page.

---

## Tech Stack

| Layer                 | Technology                                        |
| --------------------- | ------------------------------------------------- |
| Frontend Framework    | React 18 + TypeScript                             |
| Build Tool            | Vite                                              |
| Styling               | Tailwind CSS                                      |
| UI Components         | shadcn/ui (Radix UI primitives)                   |
| State / Data Fetching | TanStack React Query                              |
| Routing               | React Router v6                                   |
| Backend / DB          | Supabase (PostgreSQL + Edge Functions + Realtime) |
| Charts                | lightweight-charts (TradingView)                  |
| Notifications         | Sonner (toast)                                    |
| Testing               | Vitest                                            |

---

## Application Routes

| Path       | Page             | Description                                       |
| ---------- | ---------------- | ------------------------------------------------- |
| `/`        | Landing          | Marketing homepage with live coin prices and CTAs |
| `/trade`   | Index (Terminal) | Full trading terminal layout                      |
| `/markets` | Markets          | Full markets explorer with search, sort, tabs     |
| `/futures` | Futures          | Coming-soon futures page with email notify        |
| `*`        | NotFound         | 404 fallback page                                 |

---

## Pages

### 1. Landing (`/`)

- Hero section with headline and CTA buttons ("Start Trading", "Explore Markets")
- **Live price ticker** for 6 coins: BTC, ETH, SOL, XRP, DOGE, ADA — fetched from the Supabase Edge Function via CoinGecko
- 24h price change displayed with up/down color indicators
- Platform stats section: $2.4B+ volume, 1.2M+ users, 200+ assets, 150+ countries
- Features section: Bank-Grade Security, Lightning Fast, Advanced Charts, Global Markets
- Final CTA banner linking to `/trade`

### 2. Trade Terminal (`/trade`)

Full-screen trading UI composed of 6 panels in a CSS Grid layout:

| Panel             | Position                  | Component         |
| ----------------- | ------------------------- | ----------------- |
| Markets List      | Left column (full height) | `MarketsList`     |
| Trading Chart     | Center top                | `TradingChart`    |
| Order Book        | Right column top          | `OrderBook`       |
| Buy/Sell Terminal | Right column bottom       | `BuySellTerminal` |
| Trade History     | Center bottom             | `TradeHistory`    |
| Top Nav Bar       | Fixed header              | `TopNavBar`       |

### 3. Markets (`/markets`)

- Fetches top 20 coins by market cap from the Edge Function
- **Tabs:** All, Favorites, Top Gainers, Top Losers
- **Search bar** — filters by name or symbol in real-time
- **Sortable columns:** Price, 24h Change, Volume, Market Cap (ascending/descending)
- **Star/Favorite** toggle with local persistence
- **Refresh** button with silent-refresh (no loading flash)
- Displays: Rank, Name/Symbol, Price, 24h Change, 24h Vol, Market Cap, 24h High/Low
- Auto-refresh every 30 seconds via polling
- Toast error handling for API failures

### 4. Futures (`/futures`)

- "Coming Soon" hero with clock badge
- "Trade Spot While You Wait" CTA linking to `/trade`
- **Upcoming Pairs table** (indicative, static data):
  - BTC-PERP, ETH-PERP, SOL-PERP, BNB-PERP, XRP-PERP
  - Shows Mark Price, 24h Change (color coded), 24h Volume
- **What to Expect** feature grid:
  - Up to 100x Leverage
  - Risk Management Tools (stop-loss, take-profit, liquidation protection)
  - Perpetual Contracts (no expiry)
  - 24/7 Markets
- **Email notification form** — "Get Notified at Launch" with email input and "Notify Me" button

---

## Components

### `TopNavBar`

- Kinetix brand logo linking to `/`
- Navigation links: Exchange, Markets, Futures
- Displays selected coin name and live price (refreshes every 5s)
- Wallet balance display (fetched from Supabase `user_wallets`)
- Realtime wallet balance updates via Supabase Realtime subscription

### `MarketsList`

- Sidebar panel in the trade terminal
- Tabs: All, Fav (Favorites)
- Search input to filter coins
- Lists coins with symbol, name, price, 24h change %
- Clicking a coin updates the global `MarketContext` (switches chart, order book, terminal)
- Highlights currently selected coin
- Favorites toggle with star icon
- Auto-refreshes every 30 seconds

### `TradingChart`

- **Candlestick chart** powered by `lightweight-charts` (TradingView library)
- Dynamic coin switching — reloads chart data when selected coin changes
- **Timeframe selector:** 1m, 5m, 15m, 1H, 4H, 1D, 1W
- Fetches OHLC candle data from Edge Function (CoinGecko `/ohlc` endpoint)
- Shows price header with: current price, 24h change %, 24h volume, 24h high, 24h low
- Chart auto-resizes with `ResizeObserver`
- Dark theme styled to match the app

### `OrderBook`

- Shows live-simulated bid/ask order book anchored to the real market price
- Fetches live price from Edge Function on coin switch
- Generates 12 sell orders (above mid price) and 12 buy orders (below mid price)
- **Simulated live updates** every 1.5 seconds — randomly updates order amounts with flash animation
- Color-coded: asks in red, bids in green
- Depth fill bars behind each row showing relative order size
- Price refreshes every 10 seconds from the API

### `BuySellTerminal`

- Buy / Sell tab toggle
- **Order Type** selector: Limit, Market, Stop-Limit
- Price input (auto-filled with the live market price for selected coin)
- Amount input
- Calculated total shown in real-time
- On submit:
  1. Validates input
  2. Checks wallet balance (buy only) against Supabase `user_wallets`
  3. Inserts trade into `trade_history` table
  4. Updates wallet balance (deduct for buy, add for sell)
  5. Shows success/error toast notification
- Automatically fetches and pre-fills current price when coin changes

### `TradeHistory`

- **Trades tab:** Shows last 30 trades from Supabase `trade_history` ordered by newest first
- **Open Orders tab:** Placeholder UI (orders panel)
- **Realtime updates:** Subscribes to `INSERT` events on `trade_history` via Supabase Realtime — new trades appear instantly without refresh
- Displays: asset, side (BUY/SELL color-coded), price, amount, time

### `NavLink`

- Reusable styled navigation link component

---

## Contexts

### `MarketContext`

- Global React context wrapping the trade terminal
- Stores: `selectedCoinId` (e.g. `"bitcoin"`), `selectedSymbol` (e.g. `"BTC"`), `selectedCoin` (display name)
- Default coin: Bitcoin
- `setSelectedCoin(coinId, symbol, name)` — called from `MarketsList` when user clicks a coin
- Consumed by: `TradingChart`, `OrderBook`, `BuySellTerminal`, `TopNavBar`

---

## Backend — Supabase

### Edge Function: `crypto-data`

Deployed at: `https://<project>.supabase.co/functions/v1/crypto-data`

| Action param                         | Source API                   | Description                      |
| ------------------------------------ | ---------------------------- | -------------------------------- |
| `?action=markets`                    | CoinGecko `/coins/markets`   | Top 20 coins by market cap (USD) |
| `?action=candles&coin=<id>&days=<n>` | CoinGecko `/coins/{id}/ohlc` | OHLC candlestick data            |
| `?action=price&coin=<id>`            | CoinGecko `/simple/price`    | Live price + 24h stats           |

- Handles CORS with `Access-Control-Allow-Origin: *`
- Returns structured JSON responses
- Error handling returns `{ error: message }` with HTTP 500/400

### Database Schema

#### `trade_history`

| Column       | Type        | Notes                       |
| ------------ | ----------- | --------------------------- |
| `id`         | UUID        | Primary key, auto-generated |
| `user_id`    | UUID        | Optional (demo: no auth)    |
| `asset`      | TEXT        | e.g. "BTC"                  |
| `amount`     | NUMERIC     | Coin quantity               |
| `price`      | NUMERIC     | USD price at time of trade  |
| `side`       | TEXT        | "buy" or "sell"             |
| `created_at` | TIMESTAMPTZ | Auto-set                    |

RLS: Anyone can INSERT and SELECT (demo mode, no auth required).
Realtime: Enabled — trade inserts broadcast to subscribed clients.

#### `user_wallets`

| Column          | Type        | Notes                         |
| --------------- | ----------- | ----------------------------- |
| `id`            | UUID        | Primary key                   |
| `user_id`       | UUID        | Optional                      |
| `total_balance` | NUMERIC     | USD balance, default 12453.82 |
| `created_at`    | TIMESTAMPTZ | Auto-set                      |

RLS: Anyone can SELECT and UPDATE (demo mode).
Realtime: Enabled — balance changes broadcast instantly to `TopNavBar`.
Seeded with one demo wallet at `$12,453.82`.

---

## UI Component Library (shadcn/ui)

The following Radix UI-based components are installed and available:

`Accordion`, `AlertDialog`, `Alert`, `AspectRatio`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Calendar`, `Card`, `Carousel`, `Chart`, `Checkbox`, `Collapsible`, `Command`, `ContextMenu`, `Dialog`, `Drawer`, `DropdownMenu`, `Form`, `HoverCard`, `InputOTP`, `Input`, `Label`, `Menubar`, `NavigationMenu`, `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Slider`, `Sonner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`, `Toaster`, `ToggleGroup`, `Toggle`, `Tooltip`

---

## Project Structure

```
src/
  pages/
    Landing.tsx        # Marketing homepage
    Index.tsx          # Trade terminal (layout)
    Markets.tsx        # Markets explorer
    Futures.tsx        # Coming-soon futures page
    NotFound.tsx       # 404 page
  components/
    TopNavBar.tsx      # App header with price + wallet
    MarketsList.tsx    # Coin selector sidebar
    TradingChart.tsx   # Candlestick chart
    OrderBook.tsx      # Bid/ask order book
    BuySellTerminal.tsx# Order entry form
    TradeHistory.tsx   # Trade log with realtime updates
    NavLink.tsx        # Nav link helper
    ui/                # shadcn/ui component library
  contexts/
    MarketContext.tsx  # Selected coin global state
  integrations/
    supabase/
      client.ts        # Supabase JS client
      types.ts         # Generated DB types
  hooks/
    use-mobile.tsx     # Mobile breakpoint hook
    use-toast.ts       # Toast hook
  lib/
    utils.ts           # cn() class merge utility
supabase/
  functions/
    crypto-data/
      index.ts         # Edge function (markets/candles/price)
  migrations/
    *.sql              # DB schema migrations
```

---

## Data Flow

```
User selects coin in MarketsList
        ↓
MarketContext.setSelectedCoin()
        ↓
TradingChart  → fetches OHLC candles from Edge Function → CoinGecko
OrderBook     → fetches live price from Edge Function → CoinGecko
BuySellTerminal → fetches live price from Edge Function → CoinGecko

User places order in BuySellTerminal
        ↓
Validate balance → Supabase user_wallets
Insert trade → Supabase trade_history
Update balance → Supabase user_wallets
        ↓
TradeHistory receives realtime INSERT event → updates instantly
TopNavBar receives realtime wallet UPDATE event → balance refreshes
```

---

## Environment Variables

| Variable                        | Purpose                       |
| ------------------------------- | ----------------------------- |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project reference ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public API key  |
