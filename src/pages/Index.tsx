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
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <TopNavBar />
        <div className="flex-1 grid grid-cols-[240px_1fr_280px] grid-rows-[1fr_240px] gap-px bg-border overflow-hidden">
          {/* Left: Markets */}
          <div className="row-span-2 overflow-hidden">
            <MarketsList />
          </div>

          {/* Center-Top: Chart */}
          <div className="overflow-hidden">
            <TradingChart />
          </div>

          {/* Right: Order Book + Buy/Sell */}
          <div className="row-span-2 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <OrderBook />
            </div>
            <div className="border-t border-border">
              <BuySellTerminal />
            </div>
          </div>

          {/* Center-Bottom: Trade History */}
          <div className="overflow-hidden">
            <TradeHistory />
          </div>
        </div>
      </div>
    </MarketProvider>
  );
};

export default Index;
