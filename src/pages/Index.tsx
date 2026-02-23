import TopNavBar from "@/components/TopNavBar";
import MarketsList from "@/components/MarketsList";
import TradingChart from "@/components/TradingChart";
import OrderBook from "@/components/OrderBook";
import BuySellTerminal from "@/components/BuySellTerminal";
import TradeHistory from "@/components/TradeHistory";
import { MarketProvider } from "@/contexts/MarketContext";

const Index = () => {
  return (
    <MarketProvider>
      <div
        className="flex flex-col h-screen overflow-hidden"
        style={{ background: "#030712" }}
      >
        <TopNavBar />
        {/* ── Bento Grid Layout ── */}
        <div className="flex-1 grid grid-cols-12 grid-rows-2 gap-4 p-4 overflow-hidden">
          {/* Markets List — col-span-3, full height */}
          <div className="bento-card col-span-3 row-span-2 overflow-hidden">
            <MarketsList />
          </div>

          {/* Trading Chart — col-span-6, top row */}
          <div className="bento-card col-span-6 overflow-hidden">
            <TradingChart />
          </div>

          {/* Order Book + Buy/Sell — col-span-3, full height */}
          <div className="bento-card col-span-3 row-span-2 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <OrderBook />
            </div>
            <div className="border-t border-white/10">
              <BuySellTerminal />
            </div>
          </div>

          {/* Trade History — col-span-6, bottom row */}
          <div className="bento-card col-span-6 overflow-hidden">
            <TradeHistory />
          </div>
        </div>
      </div>
    </MarketProvider>
  );
};

export default Index;
