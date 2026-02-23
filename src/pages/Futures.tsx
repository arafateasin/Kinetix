import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Zap,
  Shield,
  BarChart2,
  Clock,
  ArrowRight,
} from "lucide-react";

const COMING_FEATURES = [
  {
    icon: Zap,
    title: "Up to 100x Leverage",
    desc: "Amplify your position with flexible leverage from 1x to 100x on major pairs.",
  },
  {
    icon: Shield,
    title: "Risk Management Tools",
    desc: "Built-in stop-loss, take-profit, and liquidation protection to guard your capital.",
  },
  {
    icon: BarChart2,
    title: "Perpetual Contracts",
    desc: "Trade BTC, ETH, SOL and more perpetual futures with no expiry date.",
  },
  {
    icon: Clock,
    title: "24/7 Markets",
    desc: "Futures markets never close — trade any time, from anywhere in the world.",
  },
];

const PAIRS = [
  {
    symbol: "BTC-PERP",
    name: "Bitcoin Perpetual",
    price: "64,472.00",
    change: "-4.33%",
    vol: "$2.1B",
    up: false,
  },
  {
    symbol: "ETH-PERP",
    name: "Ethereum Perpetual",
    price: "3,241.50",
    change: "+1.22%",
    vol: "$890M",
    up: true,
  },
  {
    symbol: "SOL-PERP",
    name: "Solana Perpetual",
    price: "142.38",
    change: "+3.47%",
    vol: "$340M",
    up: true,
  },
  {
    symbol: "BNB-PERP",
    name: "BNB Perpetual",
    price: "412.90",
    change: "-0.88%",
    vol: "$210M",
    up: false,
  },
  {
    symbol: "XRP-PERP",
    name: "Ripple Perpetual",
    price: "0.5821",
    change: "+2.10%",
    vol: "$180M",
    up: true,
  },
];

export default function Futures() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Nav */}
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
          <button className="text-foreground font-medium">Futures</button>
        </nav>
        <button
          onClick={() => navigate("/trade")}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start Trading
        </button>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-8 flex flex-col gap-10">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Hero */}
        <div className="text-center py-10 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
              <Clock className="h-3 w-3" /> Coming Soon
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              Futures Trading
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base mb-8">
              Perpetual contracts with up to 100x leverage are on their way. Be
              among the first to experience professional-grade futures on
              CryptoX.
            </p>
            <button
              onClick={() => navigate("/trade")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              Trade Spot While You Wait <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Preview pairs table */}
        <div>
          <h2 className="text-lg font-bold mb-4">Upcoming Pairs</h2>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 text-[11px] text-muted-foreground border-b border-border bg-card/80">
              <span>Pair</span>
              <span>Mark Price</span>
              <span>24h Change</span>
              <span>24h Volume</span>
            </div>
            {PAIRS.map((p) => (
              <div
                key={p.symbol}
                className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 px-4 py-3 items-center border-b border-border/50 text-sm opacity-60"
              >
                <div>
                  <div className="font-semibold text-foreground">
                    {p.symbol}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.name}
                  </div>
                </div>
                <div className="text-foreground">${p.price}</div>
                <div className={p.up ? "text-success" : "text-danger"}>
                  {p.change}
                </div>
                <div className="text-muted-foreground">{p.vol}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Prices shown are indicative only
          </p>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-lg font-bold mb-6">What to Expect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMING_FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">{f.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notify CTA */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center">
          <h3 className="text-lg font-bold mb-2">Get Notified at Launch</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Be first in line when futures trading goes live.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              placeholder="Enter your email"
              title="Email for futures launch notification"
              type="email"
            />
            <button className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap">
              Notify Me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
