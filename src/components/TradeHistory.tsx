import { useState } from "react";

const TRADES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  price: (64231.5 + (Math.random() - 0.5) * 200).toFixed(2),
  amount: (Math.random() * 1.5 + 0.001).toFixed(4),
  time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
  isBuy: Math.random() > 0.5,
}));

const OPEN_ORDERS: any[] = [];

const TradeHistory = () => {
  const [tab, setTab] = useState<"trades" | "orders">("trades");

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("trades")}
          className={`px-3 py-1.5 text-xs transition-colors ${
            tab === "trades"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Recent Trades
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-3 py-1.5 text-xs transition-colors ${
            tab === "orders"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Open Orders (0)
        </button>
      </div>

      {tab === "trades" ? (
        <>
          <div className="grid grid-cols-3 px-3 py-1 text-[10px] text-muted-foreground border-b border-border">
            <span>Price(USDT)</span>
            <span className="text-right">Amount(BTC)</span>
            <span className="text-right">Time</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {TRADES.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-3 px-3 py-[2px] text-[11px] hover:bg-secondary/30"
              >
                <span className={t.isBuy ? "text-success" : "text-danger"}>
                  {parseFloat(t.price).toLocaleString()}
                </span>
                <span className="text-right text-foreground">{t.amount}</span>
                <span className="text-right text-muted-foreground">{t.time}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
          No open orders
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
