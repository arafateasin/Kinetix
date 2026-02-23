import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Trade {
  id: string;
  price: number;
  amount: number;
  created_at: string;
  side: string;
}

const TradeHistory = () => {
  const [tab, setTab] = useState<"trades" | "orders">("trades");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from("trade_history")
      .select("id, price, amount, created_at, side")
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) setTrades(data);
    if (error) console.error("Failed to fetch trades:", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrades();

    // Subscribe to realtime trade inserts
    const channel = supabase
      .channel("trade_history_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_history" },
        (payload) => {
          setTrades((prev) => [payload.new as Trade, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour12: false });
  };

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
            {loading ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">Loading...</div>
            ) : trades.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">No trades yet</div>
            ) : (
              trades.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-3 px-3 py-[2px] text-[11px] hover:bg-secondary/30"
                >
                  <span className={t.side === "buy" ? "text-success" : "text-danger"}>
                    {t.price.toLocaleString()}
                  </span>
                  <span className="text-right text-foreground">{t.amount}</span>
                  <span className="text-right text-muted-foreground">{formatTime(t.created_at)}</span>
                </div>
              ))
            )}
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
