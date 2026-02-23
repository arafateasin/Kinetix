/**
 * Market Data Web Worker — HFT Architecture
 *
 * Offloads heavy JSON parsing, order-book generation, and price-matching
 * computation entirely off the main thread. The React UI thread never blocks
 * on data processing, guaranteeing a stable 60 fps render loop even during
 * high-velocity data spikes.
 *
 * Message protocol (main → worker):
 *   { type: 'GENERATE_ORDER_BOOK', payload: { rawJson: string, coinId: string } }
 *   { type: 'PROCESS_CANDLES',     payload: { rawJson: string } }
 *
 * Message protocol (worker → main):
 *   { type: 'ORDER_BOOK_READY', payload: { price, sells, buys } }
 *   { type: 'CANDLES_READY',    payload: CandleBar[] }
 *   { type: 'ERROR',            payload: string }
 */

export interface OrderRow {
  price: number;
  amount: number;
  total: number;
  fillPercent: number;
}

export interface OrderBookPayload {
  price: number;
  sells: OrderRow[];
  buys: OrderRow[];
}

export interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Deterministic pseudo-random seeded from price so order levels are stable */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Generates realistic order book levels from a base price.
 * Runs entirely in the worker thread — no DOM access, pure computation.
 */
function generateOrderRows(
  basePrice: number,
  count: number,
  isBuy: boolean,
): OrderRow[] {
  const rand = seededRandom(basePrice * (isBuy ? 1 : 2));
  const rows: OrderRow[] = [];
  for (let i = 0; i < count; i++) {
    // Scale offset as a fraction of basePrice so it can never exceed the price
    // itself, preventing negative buy-side prices on low-value assets.
    const offset = (i + 1) * (rand() * 0.005 + 0.001) * basePrice;
    let price = isBuy ? basePrice - offset : basePrice + offset;
    // Safety clamp: price must always be a positive value
    price = Math.max(price, 0.0001);
    const amount = rand() * 2.5 + 0.01;
    const total = price * amount;
    rows.push({
      price: Math.round(price * 100) / 100,
      amount: Math.round(amount * 10000) / 10000,
      total: Math.round(total * 100) / 100,
      fillPercent: rand() * 100,
    });
  }
  return isBuy
    ? rows.sort((a, b) => b.price - a.price)
    : rows.sort((a, b) => a.price - b.price);
}

/**
 * Parse raw CoinGecko price JSON and produce a full order book.
 * Heavy JSON.parse happens here, not on the main thread.
 */
function handleGenerateOrderBook(rawJson: string, coinId: string) {
  const data = JSON.parse(rawJson) as Record<string, { usd: number }>;
  const price = data?.[coinId]?.usd;
  if (!price) throw new Error(`No price found for ${coinId}`);

  const sells = generateOrderRows(price, 12, false);
  const buys = generateOrderRows(price, 12, true);

  const result: OrderBookPayload = { price, sells, buys };
  return result;
}

/**
 * Parse raw CoinGecko OHLC JSON array into typed CandleBar objects.
 * Runs in worker to avoid blocking the chart render.
 */
function handleProcessCandles(rawJson: string): CandleBar[] {
  const raw = JSON.parse(rawJson) as number[][];
  return raw.map((d) => ({
    time: d[0] / 1000,
    open: d[1],
    high: d[2],
    low: d[3],
    close: d[4],
  }));
}

// ── Worker message handler ──────────────────────────────────────────────────
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data as {
    type: string;
    payload: Record<string, string>;
  };

  try {
    if (type === "GENERATE_ORDER_BOOK") {
      const result = handleGenerateOrderBook(payload.rawJson, payload.coinId);
      self.postMessage({ type: "ORDER_BOOK_READY", payload: result });
      return;
    }

    if (type === "PROCESS_CANDLES") {
      const candles = handleProcessCandles(payload.rawJson);
      self.postMessage({ type: "CANDLES_READY", payload: candles });
      return;
    }

    self.postMessage({
      type: "ERROR",
      payload: `Unknown message type: ${type}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: "ERROR", payload: msg });
  }
};
