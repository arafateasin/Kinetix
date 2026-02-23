import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Zap,
  BookOpen,
  BarChart2,
  Wallet,
  Lock,
} from "lucide-react";

const sections = [
  {
    icon: <Zap className="h-5 w-5 text-blue-400" />,
    title: "Getting Started",
    items: [
      {
        label: "Create an account",
        desc: "Sign up with your email and connect your wallet to begin trading.",
      },
      {
        label: "Fund your wallet",
        desc: "Deposit USDT or other supported stablecoins to your Kinetix wallet.",
      },
      {
        label: "Execute your first trade",
        desc: "Navigate to the Trade page, select a market, and place a market or limit order.",
      },
    ],
  },
  {
    icon: <BarChart2 className="h-5 w-5 text-purple-400" />,
    title: "Trading",
    items: [
      {
        label: "Market orders",
        desc: "Execute immediately at the best available price in the order book.",
      },
      {
        label: "Limit orders",
        desc: "Set a target price; the order fills when the market reaches your price.",
      },
      {
        label: "Order book",
        desc: "Real-time depth display showing aggregated bids and asks for the selected pair.",
      },
    ],
  },
  {
    icon: <Wallet className="h-5 w-5 text-green-400" />,
    title: "Wallets & Balances",
    items: [
      {
        label: "Spot wallet",
        desc: "Holds your available USDT balance for spot trading.",
      },
      {
        label: "Transaction history",
        desc: "View all past trades and deposits in the Trade History panel.",
      },
      {
        label: "Withdrawals",
        desc: "Withdrawal support is coming soon in the Futures launch update.",
      },
    ],
  },
  {
    icon: <BookOpen className="h-5 w-5 text-yellow-400" />,
    title: "Markets",
    items: [
      {
        label: "Spot markets",
        desc: "Trade 200+ crypto pairs with real-time price feeds from CoinGecko.",
      },
      {
        label: "Futures (Beta)",
        desc: "Register for early access to perpetual futures with up to 100× leverage.",
      },
      {
        label: "Price charts",
        desc: "Candlestick charts powered by lightweight-charts with multiple timeframes.",
      },
    ],
  },
  {
    icon: <Lock className="h-5 w-5 text-red-400" />,
    title: "Security",
    items: [
      {
        label: "Row-level security",
        desc: "Every database query is scoped to the authenticated user via Supabase RLS.",
      },
      {
        label: "Atomic trades",
        desc: "All trades execute as a single atomic database transaction to prevent partial state.",
      },
      {
        label: "2FA (coming soon)",
        desc: "Two-factor authentication will be required for withdrawals above $1,000.",
      },
    ],
  },
];

export default function Docs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Button
          variant="ghost"
          className="mb-8 text-gray-400 hover:text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-2">Documentation</h1>
        <p className="text-gray-400 mb-10">
          Everything you need to know about trading on Kinetix.
        </p>

        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-5">
                {section.icon}
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
              <div className="space-y-4 pl-7">
                {section.items.map((item) => (
                  <div key={item.label}>
                    <h3 className="font-medium text-white mb-1">
                      {item.label}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-6 rounded-xl border border-white/10 bg-white/5 text-center">
          <p className="text-gray-400 mb-4">
            Have a question not answered here?
          </p>
          <a
            href="mailto:support@kinetix.trade"
            className="text-blue-400 hover:underline font-medium"
          >
            support@kinetix.trade
          </a>
        </div>
      </div>
    </div>
  );
}
