import { useState, useEffect } from "react";
import { useMarket } from "@/contexts/MarketContext";

const generateOrders = (basePrice: number, count: number, isBuy: boolean) => {
  const orders = [];
  for (let i = 0; i < count; i++) {
    const offset = (i + 1) * (Math.random() * 15 + 5);
    const price = isBuy ? basePrice - offset : basePrice + offset;
    const amount = Math.random() * 2.5 + 0.01;
    const total = price * amount;
    orders.push({
      price: Math.round(price * 100) / 100,
      amount: Math.round(amount * 10000) / 10000,
      total: Math.round(total * 100) / 100,
      fillPercent: Math.random() * 100,
    });
  }
  return isBuy
    ? orders.sort((a, b) => b.price - a.price)
    : orders.sort((a, b) => a.price - b.price);
};

const OrderBook = () => {
  const { selectedCoinId, selectedSymbol } = useMarket();
  const [currentPrice, setCurrentPrice] = useState(0);
  const [sells, setSells] = useState<any[]>([]);
  const [buys, setBuys] = useState<any[]>([]);
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);

  // Fetch current price and regenerate order book when coin changes
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!projectId || !apiKey) {
          console.error("Missing Supabase configuration");
          return;
        }

        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/crypto-data?action=price&coin=${selectedCoinId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          if (data?.[selectedCoinId]?.usd) {
            const price = data[selectedCoinId].usd;
            setCurrentPrice(price);
            setSells(generateOrders(price, 12, false));
            setBuys(generateOrders(price, 12, true));
          }
        }
      } catch (err) {
        console.error("Failed to fetch price for order book:", err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [selectedCoinId]);

  // Simulate live updates
  useEffect(() => {
    if (sells.length === 0 || buys.length === 0) return;

    const interval = setInterval(() => {
      const side = Math.random() > 0.5 ? "sell" : "buy";
      const idx = Math.floor(Math.random() * 12);
      setAnimatingIdx(idx);
      if (side === "sell") {
        setSells((prev) => {
          const next = [...prev];
          if (next[idx]) {
            next[idx] = {
              ...next[idx],
              amount: Math.round((Math.random() * 2.5 + 0.01) * 10000) / 10000,
              fillPercent: Math.random() * 100,
            };
          }
          return next;
        });
      } else {
        setBuys((prev) => {
          const next = [...prev];
          if (next[idx]) {
            next[idx] = {
              ...next[idx],
              amount: Math.round((Math.random() * 2.5 + 0.01) * 10000) / 10000,
              fillPercent: Math.random() * 100,
            };
          }
          return next;
        });
      }
      setTimeout(() => setAnimatingIdx(null), 400);
    }, 1200);
    return () => clearInterval(interval);
  }, [sells, buys]);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="px-2 py-1.5 border-b border-border text-xs font-medium text-foreground">
        Order Book
      </div>
      <div className="grid grid-cols-3 px-2 py-1 text-[10px] text-muted-foreground border-b border-border">
        <span>Price(USDT)</span>
        <span className="text-right">Amount({selectedSymbol})</span>
        <span className="text-right">Total</span>
      </div>
      {/* Sells - reverse so highest ask is at top */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse">
        {sells.map((o, i) => (
          <div
            key={`sell-${i}`}
            className="relative grid grid-cols-3 px-2 py-[2px] text-[11px]"
          >
            <div
              className="absolute inset-0 bg-danger/10"
              style={{ width: `${o.fillPercent}%`, right: 0, left: "auto" }}
            />
            <span className="relative text-danger">
              {o.price.toLocaleString()}
            </span>
            <span className="relative text-right text-foreground">
              {o.amount}
            </span>
            <span className="relative text-right text-muted-foreground">
              {o.total.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      {/* Spread / current price */}
      <div className="px-2 py-1.5 border-y border-border text-center">
        <span className="text-success font-bold text-sm">
          {currentPrice > 0
            ? currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "..."}
        </span>
        <span className="text-muted-foreground text-[10px] ml-2">
          ≈ $
          {currentPrice > 0
            ? currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "..."}
        </span>
      </div>
      {/* Buys */}
      <div className="flex-1 overflow-y-auto">
        {buys.map((o, i) => (
          <div
            key={`buy-${i}`}
            className="relative grid grid-cols-3 px-2 py-[2px] text-[11px]"
          >
            <div
              className="absolute inset-0 bg-success/10"
              style={{ width: `${o.fillPercent}%`, right: 0, left: "auto" }}
            />
            <span className="relative text-success">
              {o.price.toLocaleString()}
            </span>
            <span className="relative text-right text-foreground">
              {o.amount}
            </span>
            <span className="relative text-right text-muted-foreground">
              {o.total.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderBook;
