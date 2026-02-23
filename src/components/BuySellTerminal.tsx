import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMarket } from "@/contexts/MarketContext";

/**
 * Integration Approach — Price Feed
 * Fetches real-time coin price from the Supabase Edge Function (`crypto-data`).
 * The Edge Function proxies requests to CoinGecko’s `/simple/price` endpoint,
 * returning USD price + 24h stats. Authentication uses the Supabase anon key
 * passed as a Bearer token, ensuring the function is only callable by clients
 * with a valid project key.
 */

/** TypeScript interface for the Supabase `user_wallets` row */
interface UserWallet {
  id: string;
  total_balance: number;
}

/** TypeScript interface for the Supabase `trade_history` insert payload */
interface TradeInsert {
  asset: string;
  amount: number;
  price: number;
  side: "buy" | "sell";
}

/** TypeScript interface for the CoinGecko price response */
interface CoinPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
  };
}

const BuySellTerminal = () => {
  const { selectedCoinId, selectedSymbol } = useMarket();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState("Limit");
  const [loading, setLoading] = useState(false);
  /** Wallet balance for percentage-amount calculation on buy orders */
  const [walletBalance, setWalletBalance] = useState<number>(0);

  /**
   * Integration Approach — Live Price Fetch
   * Calls the Supabase Edge Function with `action=price&coin=<coinId>`.
   * The response is a `CoinPriceResponse` object; the USD price is extracted
   * and pre-filled into the price input so users always start with the
   * current market price. Re-runs whenever the selected coin changes.
   */
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

        const data: CoinPriceResponse = await res.json();
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

  /** Fetch wallet balance once on mount for %-amount calculation */
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const { data } = await supabase
          .from("user_wallets")
          .select("total_balance")
          .limit(1)
          .maybeSingle();
        if (data) setWalletBalance(Number(data.total_balance));
      } catch {
        // non-critical — percentage buttons will just produce 0
      }
    };
    loadBalance();
  }, []);

  /**
   * Integration Approach — Atomic Order Placement (Single-Writer Pattern)
   * Replaces the previous 3-step SELECT + INSERT + UPDATE sequence with a
   * single `supabase.rpc('place_trade_atomic')` call. The Postgres function
   * in `supabase/migrations/20260224120000_atomic_trade_rpc.sql` acquires a
   * row-level lock (`SELECT FOR UPDATE`) before checking the balance, then
   * inserts the trade and updates the balance — all in one transaction.
   *
   * Key benefits:
   *  - Eliminates TOCTOU race conditions (balance checked and debited atomically)
   *  - Reduces latency: one round-trip instead of three HTTP calls
   *  - Concurrent submissions are serialised by the Postgres row lock
   */
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
      // 1. Fetch wallet id (lightweight SELECT — id only; balance is checked inside the RPC)
      const { data: wallet, error: walletError } = (await supabase
        .from("user_wallets")
        .select("id")
        .limit(1)
        .maybeSingle()) as { data: { id: string } | null; error: Error | null };

      if (walletError)
        throw new Error("Failed to fetch wallet: " + walletError.message);
      if (!wallet)
        throw new Error("No wallet found. Please create a wallet first.");

      // 2. Execute atomic RPC — one round-trip, one Postgres transaction
      // Cast to `any` because the Supabase generated types won't include
      // `place_trade_atomic` until `supabase gen types` is re-run after migration.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rpcResult, error: rpcError } = await (supabase as any).rpc(
        "place_trade_atomic",
        {
          p_wallet_id: wallet.id,
          p_asset: selectedSymbol,
          p_amount: parseFloat(amount),
          p_price: parseFloat(price),
          p_side: side,
        },
      );

      if (rpcError) throw new Error("RPC error: " + rpcError.message);

      // 3. The Postgres function returns a JSON object with success/error fields
      const result = rpcResult as {
        success: boolean;
        new_balance?: number;
        error?: string;
      };

      if (!result?.success) {
        toast.error(result?.error ?? "Order rejected by server");
        return;
      }

      toast.success(
        `${side === "buy" ? "Buy" : "Sell"} order placed: ` +
          `${amount} ${selectedSymbol} @ $${parseFloat(
            price,
          ).toLocaleString()}` +
          (result.new_balance != null
            ? ` — Balance: $${result.new_balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`
            : ""),
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
            onClick={() => {
              const assetPrice = parseFloat(price);
              if (side === "buy") {
                // How much coin the user can buy with p% of their fiat balance
                if (assetPrice > 0 && walletBalance > 0) {
                  setAmount(
                    ((walletBalance / assetPrice) * (p / 100)).toFixed(6),
                  );
                }
              } else {
                // For sells: p% of a nominal 1-unit held position (demo placeholder)
                // In a production app this would be the user's actual held quantity
                const heldAmount = 1.0;
                setAmount((heldAmount * (p / 100)).toFixed(6));
              }
            }}
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
        className={`w-full py-2 text-xs font-bold rounded transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
          side === "buy"
            ? "bg-success hover:bg-success/90 text-success-foreground btn-buy-glow"
            : "bg-danger hover:bg-danger/90 text-danger-foreground btn-sell-glow"
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-3 w-3 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Placing Order...
          </>
        ) : side === "buy" ? (
          `Buy ${selectedSymbol}`
        ) : (
          `Sell ${selectedSymbol}`
        )}
      </button>
    </div>
  );
};

export default BuySellTerminal;
