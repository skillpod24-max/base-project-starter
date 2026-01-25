-- A/B Testing for Conversion Engines
CREATE TABLE public.ab_test_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id UUID NOT NULL REFERENCES public.turfs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  variant_name TEXT NOT NULL,
  variant_type TEXT NOT NULL, -- 'scratch_card_delay', 'scarcity_threshold', 'social_proof_window'
  variant_value JSONB NOT NULL,
  traffic_percentage INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Track which variant users are assigned to
CREATE TABLE public.ab_test_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES public.ab_test_variants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  turf_id UUID NOT NULL REFERENCES public.turfs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted BOOLEAN NOT NULL DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Track conversion metrics per variant
CREATE TABLE public.ab_test_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES public.ab_test_variants(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(variant_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ab_test_variants
CREATE POLICY "Turf owners can manage their ab tests" 
ON public.ab_test_variants 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for ab_test_assignments (allow inserts for tracking)
CREATE POLICY "Allow session tracking" 
ON public.ab_test_assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow session inserts" 
ON public.ab_test_assignments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Turf owners can view assignments" 
ON public.ab_test_assignments 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.ab_test_variants v 
  WHERE v.id = variant_id AND v.user_id = auth.uid()
));

-- RLS Policies for ab_test_metrics
CREATE POLICY "Turf owners can view metrics" 
ON public.ab_test_metrics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.ab_test_variants v 
  WHERE v.id = variant_id AND v.user_id = auth.uid()
));

CREATE POLICY "Allow metric inserts" 
ON public.ab_test_metrics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow metric updates" 
ON public.ab_test_metrics 
FOR UPDATE 
USING (true);

-- Indexes for performance
CREATE INDEX idx_ab_test_variants_turf ON public.ab_test_variants(turf_id, is_active);
CREATE INDEX idx_ab_test_assignments_session ON public.ab_test_assignments(session_id, turf_id);
CREATE INDEX idx_ab_test_metrics_variant_date ON public.ab_test_metrics(variant_id, metric_date);