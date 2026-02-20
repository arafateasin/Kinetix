import { useEffect, useState } from "react";
import { Wallet, Bell, User, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TopNavBar = () => {
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    const fetchBalance = async () => {
      const { data } = await supabase
        .from("user_wallets")
        .select("total_balance")
        .limit(1)
        .maybeSingle();
      if (data) setBalance(Number(data.total_balance));
    };
    fetchBalance();
  }, []);

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-card border-b border-border">
      <div className="flex items-center gap-6">
        <span className="text-primary font-bold text-lg tracking-tight">CryptoX</span>
        <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <span className="text-foreground font-medium cursor-pointer">Exchange</span>
          <span className="hover:text-foreground cursor-pointer">Markets</span>
          <span className="hover:text-foreground cursor-pointer">Trade</span>
          <span className="hover:text-foreground cursor-pointer">Futures</span>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Balance:</span>
          <span className="text-foreground font-semibold">${balance.toLocaleString()}</span>
        </div>
        <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
        <div className="flex items-center gap-1 cursor-pointer">
          <User className="h-4 w-4 text-muted-foreground" />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
