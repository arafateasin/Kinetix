-- ============================================================
-- HFT Single-Writer Pattern: Atomic Trade Execution RPC
-- ============================================================
-- This Postgres function implements the "Single-Writer" principle
-- for database integrity in high-frequency trading scenarios.
--
-- It runs as a single atomic transaction (BEGIN/COMMIT) so that
-- concurrent buy clicks from the same session can never produce
-- a negative balance (race condition prevention).
--
-- The function:
--   1. Validates all input parameters (amount, price, side)
--   2. Verifies the caller owns the wallet (auth.uid() check)
--   3. Locks the wallet row with FOR UPDATE (advisory row lock)
--   4. Checks current_balance >= total_cost for BUY orders
--   5. For SELL orders, verifies held quantity (demo: TODO — positions table)
--   6. Inserts the trade record into trade_history (with user_id)
--   7. Updates user_wallets.total_balance atomically
--   8. Returns the new balance to the caller
--
-- RPC call from frontend:
--   supabase.rpc('place_trade_atomic', {
--     p_wallet_id: string,
--     p_asset: string,
--     p_amount: number,
--     p_price: number,
--     p_side: 'buy' | 'sell'
--   })
-- ============================================================

CREATE OR REPLACE FUNCTION public.place_trade_atomic(
  p_wallet_id   UUID,
  p_asset       TEXT,
  p_amount      NUMERIC,
  p_price       NUMERIC,
  p_side        TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
-- Pin search_path to prevent privilege-escalation via schema injection
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_trade_total     NUMERIC;
  v_new_balance     NUMERIC;
  v_trade_id        UUID;
  v_wallet_user_id  UUID;
BEGIN
  -- ── Input validation ──────────────────────────────────────────────────────
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: p_amount must be positive, got %', p_amount;
  END IF;

  IF p_price IS NULL OR p_price <= 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: p_price must be positive, got %', p_price;
  END IF;

  IF p_side IS NULL OR p_side NOT IN ('buy', 'sell') THEN
    RAISE EXCEPTION 'INVALID_INPUT: p_side must be ''buy'' or ''sell'', got %', p_side;
  END IF;

  -- ── Ownership check (authenticated callers only) ──────────────────────────
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: caller must be authenticated';
  END IF;

  -- Step 1: Lock the wallet row and verify ownership
  SELECT total_balance, user_id
    INTO v_current_balance, v_wallet_user_id
    FROM public.user_wallets
   WHERE id = p_wallet_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: wallet_id=%', p_wallet_id;
  END IF;

  -- Ensure the caller owns this wallet
  IF v_wallet_user_id IS NOT NULL AND v_wallet_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'UNAUTHORIZED: wallet does not belong to the caller';
  END IF;

  v_trade_total := p_price * p_amount;

  -- Step 2: Side-specific balance / holdings checks
  IF p_side = 'buy' THEN
    IF v_current_balance < v_trade_total THEN
      RAISE EXCEPTION 'INSUFFICIENT_BALANCE: required=%, available=%',
        v_trade_total, v_current_balance;
    END IF;
    v_new_balance := v_current_balance - v_trade_total;

  ELSE
    -- TODO: When a positions/holdings table is introduced, query it here:
    --   SELECT held_qty INTO v_held FROM public.positions
    --    WHERE user_id = auth.uid() AND asset = p_asset FOR UPDATE;
    --   IF v_held < p_amount THEN
    --     RAISE EXCEPTION 'INSUFFICIENT_HOLDINGS: ...';
    --   END IF;
    -- Demo mode: sells credit the balance unconditionally.
    -- This is intentionally limited to demo/paper-trading behaviour.
    v_new_balance := v_current_balance + v_trade_total;
  END IF;

  -- Safety floor — balance must remain non-negative
  v_new_balance := GREATEST(v_new_balance, 0);

  -- Step 3: Insert trade record (include user_id from wallet owner)
  INSERT INTO public.trade_history (asset, amount, price, side, user_id)
  VALUES (p_asset, p_amount, p_price, p_side, v_wallet_user_id)
  RETURNING id INTO v_trade_id;

  -- Step 4: Update wallet balance atomically (same transaction)
  UPDATE public.user_wallets
     SET total_balance = v_new_balance
   WHERE id = p_wallet_id;

  -- Return result payload to caller
  RETURN json_build_object(
    'success',      true,
    'trade_id',     v_trade_id,
    'new_balance',  v_new_balance,
    'side',         p_side,
    'asset',        p_asset,
    'amount',       p_amount,
    'price',        p_price
  );

EXCEPTION
  -- Handle known business errors — return JSON so the client can display them
  WHEN SQLSTATE 'P0001' THEN
    -- RAISE EXCEPTION produces P0001; inspect the message for business errors
    DECLARE v_msg TEXT := SQLERRM;
    BEGIN
      IF v_msg LIKE 'INSUFFICIENT_BALANCE:%'
         OR v_msg LIKE 'WALLET_NOT_FOUND:%'
         OR v_msg LIKE 'INVALID_INPUT:%'
         OR v_msg LIKE 'UNAUTHORIZED:%'
         OR v_msg LIKE 'INSUFFICIENT_HOLDINGS:%' THEN
        RETURN json_build_object('success', false, 'error', v_msg);
      END IF;
      -- Unknown P0001 — re-raise so it is logged server-side
      RAISE;
    END;

  -- Re-raise all other unexpected errors so they propagate and are logged
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Grant execute only to authenticated users (removes anon access)
GRANT EXECUTE ON FUNCTION public.place_trade_atomic TO authenticated;

