
CREATE TABLE public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text,
  plan text NOT NULL CHECK (plan IN ('starter','pro')),
  cycle text NOT NULL CHECK (cycle IN ('monthly','halfyear')),
  amount_paise integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment orders"
  ON public.payment_orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_payment_orders_user ON public.payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON public.payment_orders(status);

CREATE OR REPLACE FUNCTION public.touch_payment_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_payment_orders_updated_at();
