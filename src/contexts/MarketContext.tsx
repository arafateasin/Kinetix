import { createContext, useContext, useState, ReactNode } from "react";

interface MarketContextType {
  selectedCoin: string;
  selectedCoinId: string;
  selectedSymbol: string;
  setSelectedCoin: (coinId: string, symbol: string, name: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within MarketProvider");
  }
  return context;
};

export const MarketProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCoinId, setSelectedCoinId] = useState("bitcoin");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [selectedCoin, setSelectedCoinName] = useState("Bitcoin");

  const setSelectedCoin = (coinId: string, symbol: string, name: string) => {
    setSelectedCoinId(coinId);
    setSelectedSymbol(symbol);
    setSelectedCoinName(name);
  };

  return (
    <MarketContext.Provider
      value={{
        selectedCoin,
        selectedCoinId,
        selectedSymbol,
        setSelectedCoin,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};
