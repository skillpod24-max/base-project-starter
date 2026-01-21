-- Create turf-specific psychological engines table for owner control
CREATE TABLE IF NOT EXISTS public.turf_engines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id UUID NOT NULL REFERENCES public.turfs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Scarcity Engine Settings
  scarcity_enabled BOOLEAN DEFAULT true,
  scarcity_threshold INTEGER DEFAULT 3,
  scarcity_message TEXT DEFAULT 'Only {count} slots left!',
  
  -- Social Proof Engine Settings
  social_proof_enabled BOOLEAN DEFAULT true,
  social_proof_time_window TEXT DEFAULT 'week',
  social_proof_message TEXT DEFAULT '{count} people booked this week',
  
  -- Urgency Engine Settings
  urgency_enabled BOOLEAN DEFAULT true,
  urgency_countdown_enabled BOOLEAN DEFAULT true,
  urgency_flash_offers_enabled BOOLEAN DEFAULT false,
  urgency_time_decay_enabled BOOLEAN DEFAULT false,
  urgency_decay_percentage INTEGER DEFAULT 10,
  
  -- Loyalty Engine Settings
  loyalty_enabled BOOLEAN DEFAULT true,
  loyalty_points_per_100 INTEGER DEFAULT 10,
  loyalty_show_progress BOOLEAN DEFAULT true,
  loyalty_milestone_rewards BOOLEAN DEFAULT true,
  
  -- FOMO/Live Activity Settings
  fomo_enabled BOOLEAN DEFAULT true,
  fomo_show_live_viewers BOOLEAN DEFAULT true,
  fomo_show_recent_bookings BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(turf_id)
);

-- Enable RLS
ALTER TABLE public.turf_engines ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own turf engines
CREATE POLICY "Owners can manage their turf engines"
ON public.turf_engines
FOR ALL
USING (user_id = auth.uid());

-- Public can view enabled engines for public turfs
CREATE POLICY "Public can view turf engines"
ON public.turf_engines
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM turfs 
  WHERE turfs.id = turf_engines.turf_id 
  AND turfs.is_public = true
));

-- Create trigger for updated_at
CREATE TRIGGER update_turf_engines_updated_at
BEFORE UPDATE ON public.turf_engines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();