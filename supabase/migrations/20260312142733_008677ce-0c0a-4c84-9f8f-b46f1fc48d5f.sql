
DROP POLICY "Authenticated can view mining jobs" ON public.mining_jobs;

CREATE POLICY "Admins can view mining jobs"
  ON public.mining_jobs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
