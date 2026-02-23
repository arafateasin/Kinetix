import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Wallet, Bell, User, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TopNavBar = () => {
  const [balance, setBalance] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

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
          setBalance(Number(data.total_balance));
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
            setBalance(Number(payload.new.total_balance));
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIPTION_ERROR") {
          console.error("Failed to subscribe to wallet updates");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-card border-b border-border">
      <div className="flex items-center gap-6">
        <span
          className="text-primary font-bold text-lg tracking-tight cursor-pointer select-none hover:text-primary/80 transition-colors"
          onClick={() => navigate("/")}
        >
          CryptoX
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
            onClick={() => navigate("/trade")}
            className={`cursor-pointer transition-colors hover:text-foreground ${
              location.pathname === "/trade"
                ? "text-foreground font-medium"
                : ""
            }`}
          >
            Trade
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
          <span className="text-foreground font-semibold">
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
