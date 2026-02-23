import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Wallet, Bell, User, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TopNavBar = () => {
  const [balance, setBalance] = useState<number>(0);
  const [pulseBalance, setPulseBalance] = useState(false);
  const prevBalanceRef = useRef<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Integration Approach — Real-time Wallet Balance
   * On mount, fetches the demo wallet balance from Supabase `user_wallets`.
   * A Supabase Realtime channel subscribes to UPDATE events on the same table.
   * When the BuySellTerminal modifies the balance, the change propagates here
   * instantly via WebSocket — no polling required. The balance display triggers
   * a CSS `price-pulse` animation whenever the value changes.
   */

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from("user_wallets")
          .select("total_balance")
          .limit(1)
          .maybeSingle();

        if (error) {
          throw new Error("Failed to fetch balance: " + error.message);
        }

        if (data) {
          const bal = Number(data.total_balance);
          prevBalanceRef.current = bal;
          setBalance(bal);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to fetch balance:", err);
        toast.error("Failed to load wallet balance: " + msg);
      }
    };

    fetchBalance();

    // Subscribe to wallet changes for real-time balance updates
    const channel = supabase
      .channel("wallet_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_wallets" },
        (payload) => {
          if (payload.new) {
            const newBal = Number(payload.new.total_balance);
            if (newBal !== prevBalanceRef.current) {
              prevBalanceRef.current = newBal;
              setBalance(newBal);
              setPulseBalance(true);
              setTimeout(() => setPulseBalance(false), 700);
            }
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Wallet Realtime: channel error");
        } else if (status === "TIMED_OUT" || status === "CLOSED") {
          console.warn("Wallet Realtime: channel", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <header
      className="h-12 flex items-center justify-between px-4 sticky top-0 z-50"
      style={{
        background: "rgba(3,7,18,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center gap-6">
        <span
          className="text-primary font-bold text-lg tracking-tight cursor-pointer select-none hover:text-primary/80 transition-colors"
          onClick={() => navigate("/")}
        >
          Kinetix
        </span>
        <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/trade")}
            className={`cursor-pointer transition-colors hover:text-primary ${
              location.pathname === "/trade"
                ? "text-foreground font-medium"
                : ""
            }`}
          >
            Exchange
          </button>
          <button
            onClick={() => navigate("/markets")}
            className={`cursor-pointer transition-colors hover:text-foreground ${
              location.pathname === "/markets"
                ? "text-foreground font-medium"
                : ""
            }`}
          >
            Markets
          </button>
          <button
            onClick={() => navigate("/futures")}
            className={`cursor-pointer transition-colors hover:text-foreground ${
              location.pathname === "/futures"
                ? "text-foreground font-medium"
                : ""
            }`}
          >
            Futures
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Balance:</span>
          <span
            className={`text-foreground font-semibold transition-colors ${
              pulseBalance ? "animate-price-pulse" : ""
            }`}
          >
            $
            {balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <button
          onClick={() => toast.info("Notifications coming soon")}
          className="focus:outline-none"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
        </button>
        <button
          onClick={() => navigate("/trade")}
          className="flex items-center gap-1 cursor-pointer focus:outline-none"
          aria-label="User profile"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};

export default TopNavBar;
