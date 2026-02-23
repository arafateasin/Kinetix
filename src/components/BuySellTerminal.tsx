import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMarket } from "@/contexts/MarketContext";

const BuySellTerminal = () => {
  const { selectedCoinId, selectedSymbol } = useMarket();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState("Limit");
  const [loading, setLoading] = useState(false);

  // Fetch live price for selected coin
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!projectId || !apiKey) {
          throw new Error("Missing Supabase configuration");
        }

        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/crypto-data?action=price&coin=${selectedCoinId}`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );

        if (!res.ok) throw new Error(`Failed to fetch price: ${res.status}`);

        const data = await res.json();
        if (data?.[selectedCoinId]?.usd) {
          setPrice(data[selectedCoinId].usd.toString());
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to fetch price:", err);
        toast.error("Failed to load price: " + message);
      }
    };

    fetchPrice();
  }, [selectedCoinId]);

  const handleSubmit = async () => {
    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const tradeTotal = parseFloat(price) * parseFloat(amount);

      // Validate balance for buy orders
      const { data: wallet, error: walletError } = await supabase
        .from("user_wallets")
        .select("id, total_balance")
        .limit(1)
        .maybeSingle();

      if (walletError)
        throw new Error("Failed to fetch wallet: " + walletError.message);
      if (!wallet)
        throw new Error("No wallet found. Please create a wallet first.");

      if (side === "buy" && Number(wallet.total_balance) < tradeTotal) {
        toast.error("Insufficient balance");
        setLoading(false);
        return;
      }

      // Insert trade
      const { error: tradeError } = await supabase
        .from("trade_history")
        .insert({
          asset: selectedSymbol,
          amount: parseFloat(amount),
          price: parseFloat(price),
          side,
        });

      if (tradeError)
        throw new Error("Failed to place order: " + tradeError.message);

      // Update wallet balance
      const newBalance =
        side === "buy"
          ? Number(wallet.total_balance) - tradeTotal
          : Number(wallet.total_balance) + tradeTotal;

      const { error: updateError } = await supabase
        .from("user_wallets")
        .update({ total_balance: Math.max(0, newBalance) })
        .eq("id", wallet.id);

      if (updateError)
        throw new Error("Failed to update balance: " + updateError.message);

      toast.success(
        `${
          side === "buy" ? "Buy" : "Sell"
        } order placed: ${amount} ${selectedSymbol} @ $${parseFloat(
          price,
        ).toLocaleString()}`,
      );
      setAmount("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to place order";
      console.error("Order placement failed:", err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const percentages = [25, 50, 75, 100];
  const total = (
    parseFloat(price || "0") * parseFloat(amount || "0") || 0
  ).toFixed(2);

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
            className={`transition-colors ${
              orderType === t ? "text-foreground" : "hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground">
          Price (USDT)
        </label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          title="Price in USDT"
          className="w-full bg-secondary text-foreground text-xs px-2 py-1.5 rounded border-none outline-none mt-0.5"
        />
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground">
          Amount ({selectedSymbol})
        </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-secondary text-foreground text-xs px-2 py-1.5 rounded border-none outline-none mt-0.5 placeholder:text-muted-foreground"
          aria-label={`Amount in ${selectedSymbol}`}
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
        <span className="text-foreground">
          {parseFloat(total).toLocaleString()} USDT
        </span>
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
        {loading
          ? "Placing..."
          : side === "buy"
          ? `Buy ${selectedSymbol}`
          : `Sell ${selectedSymbol}`}
      </button>
    </div>
  );
};

export default BuySellTerminal;
