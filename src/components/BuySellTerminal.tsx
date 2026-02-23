import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BuySellTerminal = () => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState("Limit");
  const [loading, setLoading] = useState(false);

  // Fetch live BTC price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/crypto-data?action=price&coin=bitcoin`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        const data = await res.json();
        if (data?.bitcoin?.usd) {
          setPrice(data.bitcoin.usd.toString());
        }
      } catch (err) {
        console.error("Failed to fetch price:", err);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 15000);
    return () => clearInterval(interval);
  }, []);

  const total = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : "0.00";

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const tradeTotal = parseFloat(price) * parseFloat(amount);

      // Insert trade
      const { error } = await supabase.from("trade_history").insert({
        asset: "BTC",
        amount: parseFloat(amount),
        price: parseFloat(price),
        side,
      });
      if (error) throw error;

      // Update wallet balance
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("id, total_balance")
        .limit(1)
        .maybeSingle();

      if (wallet) {
        const newBalance = side === "buy"
          ? Number(wallet.total_balance) - tradeTotal
          : Number(wallet.total_balance) + tradeTotal;

        await supabase
          .from("user_wallets")
          .update({ total_balance: Math.max(0, newBalance) })
          .eq("id", wallet.id);
      }

      toast.success(
        `${side === "buy" ? "Buy" : "Sell"} order placed: ${amount} BTC @ $${parseFloat(price).toLocaleString()}`
      );
      setAmount("");
    } catch (err: any) {
      toast.error("Failed to place order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const percentages = [25, 50, 75, 100];

  return (
    <div className="flex flex-col bg-card p-2 gap-2">
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={() => setSide("buy")}
          className={`py-1.5 text-xs font-semibold rounded transition-colors ${
            side === "buy"
              ? "bg-success text-success-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`py-1.5 text-xs font-semibold rounded transition-colors ${
            side === "sell"
              ? "bg-danger text-danger-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="flex gap-2 text-[10px] text-muted-foreground">
        {["Limit", "Market", "Stop"].map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`transition-colors ${orderType === t ? "text-foreground" : "hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground">Price (USDT)</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full bg-secondary text-foreground text-xs px-2 py-1.5 rounded border-none outline-none mt-0.5"
        />
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground">Amount (BTC)</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-secondary text-foreground text-xs px-2 py-1.5 rounded border-none outline-none mt-0.5 placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid grid-cols-4 gap-1">
        {percentages.map((p) => (
          <button
            key={p}
            onClick={() => setAmount((0.5 * (p / 100)).toFixed(4))}
            className="text-[10px] py-1 bg-secondary text-muted-foreground rounded hover:text-foreground transition-colors"
          >
            {p}%
          </button>
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Total</span>
        <span className="text-foreground">{parseFloat(total).toLocaleString()} USDT</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-2 text-xs font-bold rounded transition-colors disabled:opacity-50 ${
          side === "buy"
            ? "bg-success hover:bg-success/90 text-success-foreground"
            : "bg-danger hover:bg-danger/90 text-danger-foreground"
        }`}
      >
        {loading ? "Placing..." : side === "buy" ? "Buy BTC" : "Sell BTC"}
      </button>
    </div>
  );
};

export default BuySellTerminal;
