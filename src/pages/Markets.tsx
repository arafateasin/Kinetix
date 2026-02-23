import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface MarketItem {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  fav: boolean;
}

const TABS = ["All", "Favorites", "Top Gainers", "Top Losers"];

export default function Markets() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(["bitcoin", "ethereum"]),
  );
  const [sortKey, setSortKey] = useState<"price" | "change" | "volume" | "cap">(
    "cap",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchMarkets = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!projectId || !apiKey)
          throw new Error("Missing Supabase configuration");

        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/crypto-data?action=markets`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const raw = await res.json();
        if (Array.isArray(raw)) {
          setMarkets(
            raw.map((item: Record<string, unknown>) => ({
              id: String(item.id ?? ""),
              symbol: String(item.symbol ?? "").toUpperCase(),
              name: String(item.name ?? ""),
              current_price: Number(item.current_price ?? 0),
              price_change_percentage_24h: Number(
                item.price_change_percentage_24h ?? 0,
              ),
              market_cap: Number(item.market_cap ?? 0),
              total_volume: Number(item.total_volume ?? 0),
              high_24h: Number(item.high_24h ?? 0),
              low_24h: Number(item.low_24h ?? 0),
              fav: favorites.has(String(item.id ?? "")),
            })),
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error("Failed to load markets: " + msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [favorites],
  );

  useEffect(() => {
    fetchMarkets();
    const t = setInterval(() => fetchMarkets(true), 30000);
    return () => clearInterval(t);
  }, [fetchMarkets]);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMarkets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, fav: !m.fav } : m)),
    );
  };

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = markets
    .filter((m) => {
      if (search)
        return (
          m.symbol.toLowerCase().includes(search.toLowerCase()) ||
          m.name.toLowerCase().includes(search.toLowerCase())
        );
      if (activeTab === "Favorites") return m.fav;
      if (activeTab === "Top Gainers") return m.price_change_percentage_24h > 0;
      if (activeTab === "Top Losers") return m.price_change_percentage_24h < 0;
      return true;
    })
    .sort((a, b) => {
      const keyMap = {
        price: "current_price",
        change: "price_change_percentage_24h",
        volume: "total_volume",
        cap: "market_cap",
      } as const;
      const k = keyMap[sortKey] as keyof MarketItem;
      const av = Number(a[k] ?? 0);
      const bv = Number(b[k] ?? 0);
      return sortDir === "desc" ? bv - av : av - bv;
    });

  const SortBtn = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <button
      className={`flex items-center gap-0.5 hover:text-foreground transition-colors ${
        sortKey === k ? "text-foreground" : ""
      }`}
      onClick={() => handleSort(k)}
    >
      {label}
      {sortKey === k && (
        <span className="text-primary">{sortDir === "desc" ? " ↓" : " ↑"}</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 md:px-12 bg-card/80 backdrop-blur border-b border-border">
        <span
          className="text-primary font-bold text-xl tracking-tight cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          Kinetix
        </span>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/trade")}
            className="hover:text-foreground transition-colors"
          >
            Exchange
          </button>
          <button className="text-foreground font-medium">Markets</button>
          <button
            onClick={() => navigate("/trade")}
            className="hover:text-foreground transition-colors"
          >
            Trade
          </button>
          <button
            onClick={() => navigate("/futures")}
            className="hover:text-foreground transition-colors"
          >
            Futures
          </button>
        </nav>
        <button
          onClick={() => navigate("/trade")}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start Trading
        </button>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-8 flex flex-col gap-6">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold">Markets</h1>
          <button
            onClick={() => fetchMarkets(true)}
            className={`ml-auto p-1.5 rounded hover:bg-secondary transition-colors ${
              refreshing ? "animate-spin" : ""
            }`}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              placeholder="Search coin..."
              title="Search markets"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setActiveTab(t);
                  setSearch("");
                }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  activeTab === t && !search
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {/* Column headers */}
          <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 text-[11px] text-muted-foreground border-b border-border bg-card/80">
            <span />
            <span>Pair</span>
            <SortBtn k="price" label="Price" />
            <SortBtn k="change" label="24h Change" />
            <SortBtn k="volume" label="24h Volume" />
            <SortBtn k="cap" label="Market Cap" />
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Loading markets…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            filtered.map((m) => {
              const isUp = m.price_change_percentage_24h >= 0;
              return (
                <div
                  key={m.id}
                  onClick={() => navigate("/trade")}
                  className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 items-center border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors text-sm"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(m.id);
                    }}
                    className="flex items-center justify-center"
                    aria-label={`Toggle favourite ${m.name}`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        m.fav
                          ? "text-primary fill-primary"
                          : "text-muted-foreground hover:text-primary"
                      } transition-colors`}
                    />
                  </button>
                  <div>
                    <div className="font-semibold text-foreground">
                      {m.symbol}/USDT
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.name}
                    </div>
                  </div>
                  <div className="text-foreground font-medium">
                    $
                    {m.current_price >= 1
                      ? m.current_price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : m.current_price.toFixed(6)}
                  </div>
                  <div
                    className={`flex items-center gap-1 font-medium ${
                      isUp ? "text-success" : "text-danger"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {isUp ? "+" : ""}
                    {m.price_change_percentage_24h.toFixed(2)}%
                  </div>
                  <div className="text-muted-foreground">
                    {m.total_volume
                      ? `$${(m.total_volume / 1e6).toFixed(1)}M`
                      : "—"}
                  </div>
                  <div className="text-muted-foreground">
                    {m.market_cap
                      ? `$${(m.market_cap / 1e9).toFixed(2)}B`
                      : "—"}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Click any pair to open the trading terminal
        </p>
      </div>
    </div>
  );
}
