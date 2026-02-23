import { useEffect, useRef, useState, useMemo, memo } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useMarket } from "@/contexts/MarketContext";
import { toast } from "sonner";

const TradingChart = () => {
  const { selectedCoinId, selectedSymbol, selectedCoin } = useMarket();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [interval, setInterval_] = useState("1D");
  const [priceInfo, setPriceInfo] = useState({
    price: 0,
    change24h: 0,
    vol24h: "",
    high24h: 0,
    low24h: 0,
  });

  const daysMap: Record<string, string> = {
    "1m": "1",
    "5m": "1",
    "15m": "1",
    "1H": "7",
    "4H": "14",
    "1D": "90",
    "1W": "365",
  };

  const fetchCandles = async (days: string) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!projectId || !apiKey) {
        throw new Error("Missing Supabase configuration");
      }

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/crypto-data?action=candles&coin=${selectedCoinId}&days=${days}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch candles: ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((d: number[]) => ({
          time: (d[0] / 1000) as any,
          open: d[1],
          high: d[2],
          low: d[3],
          close: d[4],
        }));
      }
    } catch (err: any) {
      console.error("Failed to fetch candles:", err);
      toast.error(
        "Failed to load chart data: " + (err.message || "Unknown error"),
      );
    }
  };

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

      if (!res.ok) {
        throw new Error(`Failed to fetch price: ${res.status}`);
      }

      const data = await res.json();
      if (data?.[selectedCoinId]) {
        const coinData = data[selectedCoinId];
        setPriceInfo({
          price: coinData.usd || 0,
          change24h: coinData.usd_24h_change || 0,
          vol24h: coinData.usd_24h_vol
            ? (coinData.usd_24h_vol / 1e9).toFixed(2) + "B"
            : "N/A",
          high24h: coinData.usd_24h_high || 0,
          low24h: coinData.usd_24h_low || 0,
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch price:", err);
      toast.error(
        "Failed to load price data: " + (err.message || "Unknown error"),
      );
    }
  };

  useEffect(() => {
    fetchPrice();
    const timer = window.setInterval(fetchPrice, 10000); // Update every 10s
    return () => window.clearInterval(timer);
  }, [selectedCoinId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "hsl(225, 15%, 8%)" },
        textColor: "hsl(220, 10%, 50%)",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "hsl(225, 12%, 12%)" },
        horzLines: { color: "hsl(225, 12%, 12%)" },
      },
      crosshair: {
        vertLine: { color: "hsl(45, 88%, 50%)", width: 1, style: 2 },
        horzLine: { color: "hsl(45, 88%, 50%)", width: 1, style: 2 },
      },
      timeScale: { borderColor: "hsl(225, 12%, 16%)", timeVisible: true },
      rightPriceScale: { borderColor: "hsl(225, 12%, 16%)" },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(142, 71%, 45%)",
      downColor: "hsl(0, 72%, 51%)",
      borderUpColor: "hsl(142, 71%, 45%)",
      borderDownColor: "hsl(0, 72%, 51%)",
      wickUpColor: "hsl(142, 71%, 45%)",
      wickDownColor: "hsl(0, 72%, 51%)",
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    const loadData = async () => {
      const candles = await fetchCandles(daysMap[interval]);
      if (candles && candles.length > 0) {
        candleSeries.setData(candles);
        chart.timeScale().fitContent();
      }
    };
    loadData();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [interval, selectedCoinId]);

  const handleIntervalChange = (t: string) => {
    setInterval_(t);
  };

  /**
   * Mechanical Sympathy — useMemo on priceInfo display
   * String formatting (toLocaleString, toFixed) runs on every render.
   * Memoising behind priceInfo identity means the formatting only re-runs
   * when the price data actually changes, not on interval-selector clicks,
   * order book updates, or any other unrelated state changes in the parent.
   */
  const priceStats = useMemo(
    () => ({
      priceStr: priceInfo.price
        ? priceInfo.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "...",
      changeStr:
        (priceInfo.change24h >= 0 ? "+" : "") +
        priceInfo.change24h.toFixed(2) +
        "%",
      isPositive: priceInfo.change24h >= 0,
      volStr: priceInfo.vol24h || "...",
      highStr: priceInfo.high24h ? priceInfo.high24h.toLocaleString() : "...",
      lowStr: priceInfo.low24h ? priceInfo.low24h.toLocaleString() : "...",
    }),
    [priceInfo],
  );

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center gap-6 px-3 py-2 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-bold text-sm">
            {selectedSymbol ? `${selectedSymbol}/USDT` : "BTC/USDT"}
          </span>
          <span className="text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">
            Spot
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Price </span>
          <span
            className={`font-semibold ${
              priceStats.isPositive ? "text-success" : "text-danger"
            }`}
          >
            {priceStats.priceStr}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {priceStats.isPositive ? (
            <TrendingUp className="h-3 w-3 text-success" />
          ) : (
            <TrendingDown className="h-3 w-3 text-danger" />
          )}
          <span className="text-muted-foreground">24h </span>
          <span
            className={priceStats.isPositive ? "text-success" : "text-danger"}
          >
            {priceStats.changeStr}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">24h Vol </span>
          <span className="text-foreground">{priceStats.volStr}</span>
        </div>
        <div>
          <span className="text-muted-foreground">High </span>
          <span className="text-foreground">{priceStats.highStr}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Low </span>
          <span className="text-foreground">{priceStats.lowStr}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 px-3 py-1 border-b border-border text-[10px] text-muted-foreground">
        {["1m", "5m", "15m", "1H", "4H", "1D", "1W"].map((t) => (
          <button
            key={t}
            onClick={() => handleIntervalChange(t)}
            className={`px-2 py-0.5 rounded transition-colors ${
              t === interval
                ? "bg-primary/10 text-primary"
                : "hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          <span>Indicators</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
};

// React.memo: skips re-render when the *parent* re-renders without changing
// the props passed to TradingChart. Note: MarketContext updates (selectedCoinId,
// selectedSymbol) still trigger a re-render because the component subscribes
// via useMarket() — memo only prevents unnecessary parent-driven renders.
export default memo(TradingChart);
