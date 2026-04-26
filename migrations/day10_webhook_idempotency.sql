-- Day 10 — Stripe webhook idempotency + atomic search increment
-- Uses uniquely-tagged dollar-quotes ($add_searches$, $proc$, $find$) instead
-- of $$ to avoid Supabase SQL editor parser confusion when pasted.

ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_usage_stripe_customer_id
  ON user_usage(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  user_id      UUID,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION add_searches(
  p_user_id UUID, p_searches INTEGER, p_plan TEXT, p_stripe_customer_id TEXT DEFAULT NULL
) RETURNS user_usage LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $add_searches$
DECLARE v_result user_usage;
BEGIN
  UPDATE user_usage
  SET searches_remaining = COALESCE(searches_remaining, 0) + p_searches,
      searches_total     = COALESCE(searches_total, 0) + p_searches,
      plan               = p_plan,
      stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
      updated_at         = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_result;
  IF NOT FOUND THEN
    INSERT INTO user_usage (user_id, plan, searches_remaining, searches_total, stripe_customer_id, updated_at)
    VALUES (p_user_id, p_plan, p_searches, p_searches, p_stripe_customer_id, NOW())
    RETURNING * INTO v_result;
  END IF;
  RETURN v_result;
END;
$add_searches$;

CREATE OR REPLACE FUNCTION process_stripe_event(
  p_event_id TEXT, p_event_type TEXT, p_user_id UUID,
  p_searches INTEGER, p_plan TEXT, p_stripe_customer_id TEXT DEFAULT NULL
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $proc$
DECLARE v_inserted TEXT;
BEGIN
  INSERT INTO stripe_webhook_events (event_id, event_type, user_id)
  VALUES (p_event_id, p_event_type, p_user_id)
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id INTO v_inserted;
  IF v_inserted IS NULL THEN RETURN 'already_processed'; END IF;
  PERFORM add_searches(p_user_id, p_searches, p_plan, p_stripe_customer_id);
  RETURN 'processed';
END;
$proc$;

CREATE OR REPLACE FUNCTION find_user_by_stripe_customer(p_customer_id TEXT)
RETURNS UUID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $find$
  SELECT user_id FROM user_usage WHERE stripe_customer_id = p_customer_id LIMIT 1;
$find$;
