
-- Create trade_history table
CREATE TABLE public.trade_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  asset TEXT NOT NULL DEFAULT 'BTC',
  amount NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  side TEXT NOT NULL DEFAULT 'buy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert for demo purposes (no auth required)
CREATE POLICY "Anyone can insert trades" ON public.trade_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read trades" ON public.trade_history FOR SELECT USING (true);

-- Create user_wallets table
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  total_balance NUMERIC NOT NULL DEFAULT 12453.82,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wallets" ON public.user_wallets FOR SELECT USING (true);
CREATE POLICY "Anyone can update wallets" ON public.user_wallets FOR UPDATE USING (true);

-- Insert a demo wallet
INSERT INTO public.user_wallets (total_balance) VALUES (12453.82);
