import { useState, useEffect, useCallback } from "react";
import { Search, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MarketItem {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  fav: boolean;
}

const MarketsList = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["bitcoin", "ethereum"]));

  const fetchMarkets = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("crypto-data", {
        body: null,
        method: "GET",
      });
      // Use query params via direct fetch since invoke doesn't support query params well
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/crypto-data?action=markets`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const rawData = await res.json();
      if (Array.isArray(rawData)) {
        setMarkets(
          rawData.map((item: any) => ({
            id: item.id,
            symbol: item.symbol?.toUpperCase() || "",
            name: item.name || "",
            current_price: item.current_price || 0,
            price_change_percentage_24h: item.price_change_percentage_24h || 0,
            fav: favorites.has(item.id),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch markets:", err);
    } finally {
      setLoading(false);
    }
  }, [favorites]);

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMarkets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, fav: !m.fav } : m))
    );
  };

  const filtered = markets.filter((m) => {
    if (activeTab === "Favorites") return m.fav;
    if (search) return m.symbol.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const tabs = ["Favorites", "All", "Spot"];

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            className="w-full bg-secondary text-foreground text-xs pl-7 pr-2 py-1.5 rounded border-none outline-none placeholder:text-muted-foreground"
            placeholder="Search pair..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-0 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 text-xs py-1.5 transition-colors ${
              activeTab === t
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between px-2 py-1 text-[10px] text-muted-foreground border-b border-border">
        <span>Pair</span>
        <span>Price</span>
        <span>Change</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">Loading...</div>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-2 py-1.5 hover:bg-secondary/50 cursor-pointer text-xs"
            >
              <div className="flex items-center gap-1.5">
                <Star
                  className={`h-3 w-3 cursor-pointer ${m.fav ? "text-primary fill-primary" : "text-muted-foreground"}`}
                  onClick={() => toggleFav(m.id)}
                />
                <span className="text-foreground font-medium">{m.symbol}/USDT</span>
              </div>
              <span className="text-foreground">
                {m.current_price >= 1
                  ? m.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : m.current_price.toFixed(4)}
              </span>
              <span className={m.price_change_percentage_24h >= 0 ? "text-success" : "text-danger"}>
                {m.price_change_percentage_24h >= 0 ? "+" : ""}
                {m.price_change_percentage_24h.toFixed(2)}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MarketsList;
