CREATE OR REPLACE FUNCTION public.increment_coupon_uses(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coupons
  SET uses_count = uses_count + 1
  WHERE code = _code AND is_active = true;
$$;