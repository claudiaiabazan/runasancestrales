DROP POLICY "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND paid_credits = (SELECT p.paid_credits FROM public.profiles p WHERE p.id = auth.uid())
  );