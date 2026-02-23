/**
 * OrderBook Component — HFT Architecture
 *
 * Mechanical Sympathy improvements:
 * - React.memo prevents re-renders when parent re-renders unrelated state
 * - useMemo memoises the rendered sell/buy row arrays so DOM diffing is
 *   skipped when the order arrays haven't changed
 * - Web Worker offloads JSON parsing + order book generation off the main
 *   thread, ensuring the chart and UI remain at 60 fps
 * - Supabase Realtime subscription on `trade_history` replaces the 10-second
 *   polling interval — the book only re-prices on actual market events
 */

import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
import { useMarket } from "@/contexts/MarketContext";
import { supabase } from "@/integrations/supabase/client";
import type {
  OrderBookPayload,
  OrderRow as OrderRowType,
} from "@/workers/marketDataWorker";

// ── Memoised row sub-component ────────────────────────────────────────────────

interface RowProps {
  order: OrderRowType;
  side: "buy" | "sell";
  isAnimating: boolean;
}

/**
 * Memoised single order-book row.
 * Only re-renders when its specific order object reference changes,
 * not when sibling rows update.
 */
const OrderRow = memo(({ order, side, isAnimating }: RowProps) => (
  <div
    className={`relative grid grid-cols-3 px-2 py-[2px] text-[11px] transition-opacity ${
      isAnimating ? "opacity-60" : "opacity-100"
    }`}
  >
    <div
      className={`absolute inset-0 ${
        side === "sell" ? "bg-danger/10" : "bg-success/10"
      }`}
      style={{ width: `${order.fillPercent}%`, right: 0, left: "auto" }}
    />
    <span
      className={`relative ${side === "sell" ? "text-danger" : "text-success"}`}
    >
      {order.price.toLocaleString()}
    </span>
    <span className="relative text-right text-foreground">{order.amount}</span>
    <span className="relative text-right text-muted-foreground">
      {order.total.toLocaleString()}
    </span>
  </div>
));
OrderRow.displayName = "OrderRow";

// ── Main OrderBook component ──────────────────────────────────────────────────

const OrderBook = memo(() => {
  const { selectedCoinId, selectedSymbol } = useMarket();
  const [currentPrice, setCurrentPrice] = useState(0);
  const [sells, setSells] = useState<OrderRowType[]>([]);
  const [buys, setBuys] = useState<OrderRowType[]>([]);
  const [animatingSellIdx, setAnimatingSellIdx] = useState<number | null>(null);
  const [animatingBuyIdx, setAnimatingBuyIdx] = useState<number | null>(null);

  /** Web Worker instance — persisted across renders via ref */
  const workerRef = useRef<Worker | null>(null);

  // ── Initialise Web Worker ─────────────────────────────────────────────────
  useEffect(() => {
    /**
     * Integration Approach — Web Worker (Main Thread Offload)
     * The worker is instantiated once and reused. It receives raw JSON strings
     * and returns fully processed order-book payloads via postMessage, so that
     * JSON.parse, floating-point math, and array sorting never block the UI
     * render loop (Mechanical Sympathy / 60 fps guarantee).
     */
    workerRef.current = new Worker(
      new URL("../workers/marketDataWorker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data as {
        type: string;
        payload: OrderBookPayload | string;
      };
      if (type === "ORDER_BOOK_READY") {
        const book = payload as OrderBookPayload;
        setCurrentPrice(book.price);
        setSells(book.sells);
        setBuys(book.buys);
      }
      if (type === "ERROR") {
        console.error("[MarketDataWorker]", payload);
      }
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // ── Fetch price → dispatch to worker ─────────────────────────────────────
  const fetchAndDispatch = useCallback(async () => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!projectId || !apiKey || !workerRef.current) return;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/crypto-data?action=price&coin=${selectedCoinId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
      if (!res.ok) return;

      // Send raw JSON string to worker — avoids double-parse on main thread
      const rawJson = await res.text();
      workerRef.current.postMessage({
        type: "GENERATE_ORDER_BOOK",
        payload: { rawJson, coinId: selectedCoinId },
      });
    } catch (err) {
      console.error("OrderBook price fetch failed:", err);
    }
  }, [selectedCoinId]);

  // ── Event-Driven Refresh via Supabase Realtime ────────────────────────────
  useEffect(() => {
    /**
     * Integration Approach — Event-Driven (Supabase Realtime)
     * Instead of a 10-second polling interval, the order book re-prices
     * whenever a new trade is inserted into `trade_history`. This is the
     * WebSocket-based, push-model approach: react to events, don't poll.
     */
    fetchAndDispatch(); // Initial load on coin switch

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCoinId, fetchAndDispatch]);

  // ── Simulate live micro-updates (tick simulation) ─────────────────────────
  useEffect(() => {
    if (sells.length === 0 || buys.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const id = setInterval(() => {
      const side = Math.random() > 0.5 ? "sell" : "buy";
      const idx = Math.floor(Math.random() * 12);

      const updater = (prev: OrderRowType[]): OrderRowType[] => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = {
            ...next[idx],
            amount: Math.round((Math.random() * 2.5 + 0.01) * 10000) / 10000,
            fillPercent: Math.random() * 100,
          };
        }
        return next;
      };

      if (side === "sell") {
        setAnimatingSellIdx(idx);
        setSells(updater);
      } else {
        setAnimatingBuyIdx(idx);
        setBuys(updater);
      }

      // Clear previous timeout before setting a new one to prevent leaks
      if (timeoutId !== null) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setAnimatingSellIdx(null);
        setAnimatingBuyIdx(null);
      }, 400);
    }, 1200);

    return () => {
      clearInterval(id);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [sells.length, buys.length]);

  // ── useMemo: memoised row JSX arrays ─────────────────────────────────────
  /**
   * Mechanical Sympathy — useMemo
   * The sell and buy row JSX arrays are memoised independently. If `buys`
   * changes but `sells` did not, only the buy half re-renders, halving
   * unnecessary DOM diffing during one-sided order flow.
   */
  const sellRows = useMemo(
    () =>
      sells.map((o, i) => (
        <OrderRow
          key={`sell-${i}`}
          order={o}
          side="sell"
          isAnimating={animatingSellIdx === i}
        />
      )),
    [sells, animatingSellIdx],
  );

  const buyRows = useMemo(
    () =>
      buys.map((o, i) => (
        <OrderRow
          key={`buy-${i}`}
          order={o}
          side="buy"
          isAnimating={animatingBuyIdx === i}
        />
      )),
    [buys, animatingBuyIdx],
  );

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="px-2 py-1.5 border-b border-white/10 text-xs font-medium text-foreground flex items-center justify-between">
        <span>Order Book</span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
          Live
        </span>
      </div>
      <div className="grid grid-cols-3 px-2 py-1 text-[10px] text-muted-foreground border-b border-white/10">
        <span>Price(USDT)</span>
        <span className="text-right">Amount({selectedSymbol})</span>
        <span className="text-right">Total</span>
      </div>

      {/* Sells — reversed so highest ask is closest to mid price */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse">
        {sellRows}
      </div>

      {/* Mid price */}
      <div className="px-2 py-1.5 border-y border-white/10 text-center">
        <span className="text-success font-bold text-sm">
          {currentPrice > 0
            ? currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "..."}
        </span>
      </div>

      {/* Buys */}
      <div className="flex-1 overflow-y-auto">{buyRows}</div>
    </div>
  );
});

OrderBook.displayName = "OrderBook";

export default OrderBook;
