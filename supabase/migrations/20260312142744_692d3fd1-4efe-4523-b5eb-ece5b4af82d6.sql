
DROP POLICY "Authenticated can view mining_runs" ON public.mining_runs;

CREATE POLICY "Admins can view mining_runs"
  ON public.mining_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
