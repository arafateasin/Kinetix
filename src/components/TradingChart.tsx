import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

const generateCandleData = () => {
  const data = [];
  let time = new Date("2024-01-01").getTime() / 1000;
  let open = 58000;
  for (let i = 0; i < 200; i++) {
    const close = open + (Math.random() - 0.48) * 800;
    const high = Math.max(open, close) + Math.random() * 400;
    const low = Math.min(open, close) - Math.random() * 400;
    data.push({
      time: time as any,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });
    time += 86400;
    open = close;
  }
  return data;
};

const TradingChart = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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
      timeScale: {
        borderColor: "hsl(225, 12%, 16%)",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "hsl(225, 12%, 16%)",
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(142, 71%, 45%)",
      downColor: "hsl(0, 72%, 51%)",
      borderUpColor: "hsl(142, 71%, 45%)",
      borderDownColor: "hsl(0, 72%, 51%)",
      wickUpColor: "hsl(142, 71%, 45%)",
      wickDownColor: "hsl(0, 72%, 51%)",
    });

    candleSeries.setData(generateCandleData());
    chart.timeScale().fitContent();

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
  }, []);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Stats header */}
      <div className="flex items-center gap-6 px-3 py-2 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-bold text-sm">BTC/USDT</span>
          <span className="text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">Spot</span>
        </div>
        <div>
          <span className="text-muted-foreground">Price </span>
          <span className="text-success font-semibold">64,231.50</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-success" />
          <span className="text-muted-foreground">24h </span>
          <span className="text-success">+2.45%</span>
        </div>
        <div>
          <span className="text-muted-foreground">24h Vol </span>
          <span className="text-foreground">1.23B</span>
        </div>
        <div>
          <span className="text-muted-foreground">High </span>
          <span className="text-foreground">65,102.00</span>
        </div>
        <div>
          <span className="text-muted-foreground">Low </span>
          <span className="text-foreground">62,845.30</span>
        </div>
      </div>
      {/* Time interval bar */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-border text-[10px] text-muted-foreground">
        {["1m", "5m", "15m", "1H", "4H", "1D", "1W"].map((t, i) => (
          <button
            key={t}
            className={`px-2 py-0.5 rounded transition-colors ${
              t === "1D" ? "bg-primary/10 text-primary" : "hover:text-foreground"
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
      {/* Chart */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
};

export default TradingChart;
