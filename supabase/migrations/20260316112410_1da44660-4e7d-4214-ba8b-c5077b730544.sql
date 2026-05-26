
-- Table for storing fixed seeds per option combination
CREATE TABLE public.generation_seeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  options_hash text NOT NULL UNIQUE,
  seed integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_seeds ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read/insert seeds (they're shared across users for consistency)
CREATE POLICY "Authenticated can read seeds" ON public.generation_seeds
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert seeds" ON public.generation_seeds
  FOR INSERT TO authenticated WITH CHECK (true);

-- Table for caching generated images by option hash
CREATE TABLE public.generation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  options_hash text NOT NULL UNIQUE,
  image_url text NOT NULL,
  prompt_used text,
  seed_used integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read cache" ON public.generation_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage cache" ON public.generation_cache
  FOR ALL TO service_role USING (true);

-- Index for fast hash lookups
CREATE INDEX idx_generation_seeds_hash ON public.generation_seeds (options_hash);
CREATE INDEX idx_generation_cache_hash ON public.generation_cache (options_hash);
