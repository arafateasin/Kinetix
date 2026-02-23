import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  BarChart2,
  Globe,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";

const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", color: "text-yellow-400" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", color: "text-blue-400" },
  { id: "solana", symbol: "SOL", name: "Solana", color: "text-purple-400" },
  { id: "ripple", symbol: "XRP", name: "XRP", color: "text-cyan-400" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", color: "text-amber-400" },
  { id: "cardano", symbol: "ADA", name: "Cardano", color: "text-teal-400" },
];

interface CoinPrice {
  usd: number;
  usd_24h_change: number;
}

interface PriceMap {
  [key: string]: CoinPrice;
}

const FEATURES = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "Multi-signature cold storage and 2FA protect your assets 24/7.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Execute trades in milliseconds with our high-performance matching engine.",
  },
  {
    icon: BarChart2,
    title: "Advanced Charts",
    desc: "Professional TradingView-powered charts with 100+ indicators.",
  },
  {
    icon: Globe,
    title: "Global Markets",
    desc: "Trade 200+ crypto pairs with deep liquidity around the clock.",
  },
];

const STATS = [
  { label: "24h Volume", value: "$2.4B+" },
  { label: "Active Users", value: "1.2M+" },
  { label: "Supported Assets", value: "200+" },
  { label: "Countries", value: "150+" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<PriceMap>({});

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!projectId || !apiKey) return;

        const ids = COINS.map((c) => c.id).join(",");
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/crypto-data?action=price&coin=${ids}`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
        if (!res.ok) return;
        const data = await res.json();
        setPrices(data);
      } catch {
        // silent fail on landing
      }
    };
    fetchPrices();
    const t = setInterval(fetchPrices, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 md:px-12 bg-card/80 backdrop-blur border-b border-border">
        <span
          className="text-primary font-bold text-xl tracking-tight cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          CryptoX
        </span>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/trade")}
            className="hover:text-foreground transition-colors"
          >
            Exchange
          </button>
          <button
            onClick={() => navigate("/markets")}
            className="hover:text-foreground transition-colors"
          >
            Markets
          </button>
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/trade")}
            className="px-4 py-1.5 text-sm rounded bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/trade")}
            className="px-4 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">
            <Zap className="h-3 w-3" /> The fastest crypto exchange
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Trade Crypto
            <br />
            <span className="text-primary">With Confidence</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10">
            CryptoX gives you real-time data, professional charts, and instant
            execution — all in one sleek platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/trade")}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              Start Trading <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/markets")}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary text-foreground font-semibold hover:bg-secondary/70 transition-colors text-sm"
            >
              View Markets <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {STATS.map((s) => (
            <div key={s.label} className="px-8 py-6 text-center">
              <div className="text-2xl font-bold text-foreground">
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Prices ── */}
      <section className="max-w-5xl mx-auto w-full px-6 py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Live Prices</h2>
          <button
            onClick={() => navigate("/markets")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all markets <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COINS.map((coin) => {
            const p = prices[coin.id];
            const change = p?.usd_24h_change ?? 0;
            const isUp = change >= 0;
            return (
              <button
                key={coin.id}
                onClick={() => navigate("/trade")}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors text-left"
              >
                <div>
                  <div className={`font-bold text-sm ${coin.color}`}>
                    {coin.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {coin.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {p
                      ? `$${p.usd.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "—"}
                  </div>
                  <div
                    className={`text-xs flex items-center justify-end gap-0.5 ${
                      isUp ? "text-success" : "text-danger"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isUp ? "+" : ""}
                    {change.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-card/30 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-center mb-10">Why CryptoX?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 p-5 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="font-semibold text-sm">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto w-full px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to start trading?</h2>
        <p className="text-muted-foreground text-sm mb-8">
          Join over 1.2 million traders worldwide.
        </p>
        <button
          onClick={() => navigate("/trade")}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          Open Exchange <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card/50 px-6 py-6 text-center text-xs text-muted-foreground">
        © 2026 CryptoX. All rights reserved. Trade responsibly.
      </footer>
    </div>
  );
}
