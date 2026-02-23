-- Create table for futures early-access notification sign-ups
CREATE TABLE IF NOT EXISTS public.futures_notify (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT futures_notify_email_key UNIQUE (email)
);

-- Enable Row Level Security
ALTER TABLE public.futures_notify ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated visitors) to sign up
CREATE POLICY "anyone can insert futures_notify"
  ON public.futures_notify
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated admins / service-role can read the list
-- (restrict SELECT so individual emails are not publicly enumerable)
CREATE POLICY "service role can select futures_notify"
  ON public.futures_notify
  FOR SELECT
  USING (auth.role() = 'service_role');
