import { useState } from "react";
import { Search, Star } from "lucide-react";

const MARKETS = [
  { pair: "BTC/USDT", price: "64,231.50", change: "+2.45%", up: true, fav: true },
  { pair: "ETH/USDT", price: "3,421.80", change: "+1.87%", up: true, fav: true },
  { pair: "BNB/USDT", price: "584.30", change: "-0.32%", up: false, fav: false },
  { pair: "SOL/USDT", price: "142.65", change: "+5.12%", up: true, fav: false },
  { pair: "XRP/USDT", price: "0.5234", change: "-1.05%", up: false, fav: false },
  { pair: "ADA/USDT", price: "0.4521", change: "+0.78%", up: true, fav: false },
  { pair: "DOGE/USDT", price: "0.1245", change: "+3.21%", up: true, fav: false },
  { pair: "DOT/USDT", price: "7.234", change: "-0.45%", up: false, fav: false },
  { pair: "AVAX/USDT", price: "35.42", change: "+2.10%", up: true, fav: false },
  { pair: "LINK/USDT", price: "14.87", change: "+1.34%", up: true, fav: false },
  { pair: "MATIC/USDT", price: "0.8912", change: "-0.67%", up: false, fav: false },
  { pair: "UNI/USDT", price: "9.234", change: "+0.45%", up: true, fav: false },
];

const tabs = ["Favorites", "All", "Spot"];

const MarketsList = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = MARKETS.filter((m) => {
    if (activeTab === "Favorites") return m.fav;
    if (search) return m.pair.toLowerCase().includes(search.toLowerCase());
    return true;
  });

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
        {filtered.map((m) => (
          <div
            key={m.pair}
            className="flex items-center justify-between px-2 py-1.5 hover:bg-secondary/50 cursor-pointer text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Star
                className={`h-3 w-3 ${m.fav ? "text-primary fill-primary" : "text-muted-foreground"}`}
              />
              <span className="text-foreground font-medium">{m.pair}</span>
            </div>
            <span className="text-foreground">{m.price}</span>
            <span className={m.up ? "text-success" : "text-danger"}>{m.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketsList;
