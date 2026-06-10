
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paid_credits integer NOT NULL DEFAULT 0;

CREATE TABLE public.mp_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mp_payment_id text NOT NULL UNIQUE,
  preference_id text,
  status text NOT NULL,
  amount numeric(10,2) NOT NULL,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mp_payments TO authenticated;
GRANT ALL ON public.mp_payments TO service_role;

ALTER TABLE public.mp_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.mp_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
