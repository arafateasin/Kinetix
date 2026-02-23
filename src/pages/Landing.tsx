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
  Lock,
  Activity,
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
    <div
      className="min-h-screen text-foreground flex flex-col overflow-x-hidden"
      style={{ background: "#030712" }}
    >
      {/* ── Ambient background grid + orbs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[90px]" />
      </div>

      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 md:px-16"
        style={{
          background: "rgba(3,7,18,0.8)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          className="text-primary font-extrabold text-xl tracking-tight cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          Kinetix
        </span>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {["Exchange", "Markets", "Futures"].map((label) => (
            <button
              key={label}
              onClick={() =>
                navigate(
                  label === "Exchange"
                    ? "/trade"
                    : label === "Markets"
                    ? "/markets"
                    : "/futures",
                )
              }
              className="hover:text-foreground transition-colors"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/trade")}
            className="px-4 py-2 text-sm rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/trade")}
            className="px-5 py-2 text-sm rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/85 transition-all glow-primary"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 pt-24 pb-16">
        <div className="flex flex-col items-center text-center mb-16">
          <span
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "rgba(234,179,8,0.08)",
              border: "1px solid rgba(234,179,8,0.2)",
              color: "hsl(45 88% 55%)",
            }}
          >
            <Activity className="h-3 w-3" />
            Live on mainnet · 1.2M+ traders
          </span>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Trade the
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, hsl(45,88%,60%) 0%, hsl(35,90%,55%) 50%, #f97316 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Future of Finance
            </span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Kinetix gives you real-time data, professional charts, and instant
            execution — all in one premium Web3 platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => navigate("/trade")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/85 transition-all text-sm glow-primary"
            >
              Launch Terminal <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/markets")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold text-foreground hover:text-primary transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Explore Markets <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Live Prices — wide card */}
          <div className="bento-card md:col-span-8 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base text-foreground">
                Live Prices
              </h2>
              <button
                onClick={() => navigate("/markets")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                All markets <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COINS.map((coin) => {
                const p = prices[coin.id];
                const change = p?.usd_24h_change ?? 0;
                const isUp = change >= 0;
                return (
                  <button
                    key={coin.id}
                    onClick={() => navigate("/trade")}
                    className="flex items-center justify-between p-3.5 rounded-2xl text-left transition-all hover:scale-[1.02]"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div>
                      <div className={`font-bold text-sm ${coin.color}`}>
                        {coin.symbol}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
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
                        className={`text-[11px] flex items-center justify-end gap-0.5 mt-0.5 ${
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
          </div>

          {/* Stats — tall card */}
          <div className="bento-card md:col-span-4 p-6 flex flex-col justify-between gap-4">
            <h2 className="font-bold text-base">Platform Stats</h2>
            <div className="flex flex-col gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-3 px-4 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="text-xs text-muted-foreground">
                    {s.label}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/trade")}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/85 transition-all glow-primary"
            >
              Start Trading
            </button>
          </div>

          {/* Feature cards — 2 col each */}
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`bento-card p-6 flex flex-col gap-4 ${
                i < 2 ? "md:col-span-3" : "md:col-span-3"
              }`}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(234,179,8,0.1)",
                  border: "1px solid rgba(234,179,8,0.15)",
                }}
              >
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-sm mb-1.5">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </div>
              </div>
            </div>
          ))}

          {/* CTA Banner — full width */}
          <div className="bento-card md:col-span-12 p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 20% 50%, rgba(234,179,8,0.08) 0%, transparent 60%)",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary font-semibold uppercase tracking-widest">
                  Secure · Non-Custodial · Always On
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-foreground">
                Ready to trade the next
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(90deg, hsl(45,88%,60%), #f97316)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  market cycle?
                </span>
              </h3>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/trade")}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/85 transition-all text-sm glow-primary"
              >
                Open Exchange <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/futures")}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold text-foreground hover:text-primary transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Futures <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 mt-auto px-6 py-8 text-center text-xs text-muted-foreground"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
          <span className="font-bold text-primary text-sm">Kinetix</span>
          <span>© 2026 Kinetix. All rights reserved. Trade responsibly.</span>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/terms")}
              className="hover:text-foreground transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => navigate("/privacy")}
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate("/docs")}
              className="hover:text-foreground transition-colors"
            >
              Docs
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
