-- Enable realtime for user_wallets table to support real-time balance updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
