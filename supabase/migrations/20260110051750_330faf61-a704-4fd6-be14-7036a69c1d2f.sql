-- Create loyalty milestone offers table for nth booking rewards
CREATE TABLE IF NOT EXISTS public.loyalty_milestone_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  turf_id UUID REFERENCES public.turfs(id) ON DELETE CASCADE,
  milestone_booking_count INTEGER NOT NULL DEFAULT 5,
  reward_type TEXT NOT NULL DEFAULT 'discount',
  reward_value NUMERIC NOT NULL DEFAULT 0,
  free_hour_on_duration INTEGER DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_milestone_offers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users manage own loyalty milestone offers"
ON public.loyalty_milestone_offers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active milestone offers"
ON public.loyalty_milestone_offers
FOR SELECT
USING (is_active = true);

-- Create psychological engines table for admin control
CREATE TABLE IF NOT EXISTS public.psychological_engines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engine_type TEXT NOT NULL,
  engine_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.psychological_engines ENABLE ROW LEVEL SECURITY;

-- Only admins can manage engines
CREATE POLICY "Admins manage psychological engines"
ON public.psychological_engines
FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Public can view enabled engines
CREATE POLICY "Public can view enabled engines"
ON public.psychological_engines
FOR SELECT
USING (is_enabled = true);

-- Insert default engines
INSERT INTO public.psychological_engines (engine_type, engine_name, config, priority) VALUES
('scarcity', 'Scarcity Engine', '{"show_slots_left": true, "threshold": 3, "message_template": "Only {count} slots left today!"}', 1),
('social_proof', 'Social Proof Engine', '{"show_bookings_count": true, "time_window": "week", "message_template": "{count} people booked this week"}', 2),
('urgency', 'Urgency Engine', '{"enable_flash_offers": true, "time_decay_enabled": true, "countdown_enabled": true}', 3),
('loyalty', 'Loyalty Engine', '{"points_per_100": 10, "show_progress": true, "milestone_rewards": true}', 4)
ON CONFLICT DO NOTHING;

-- Create timestamp update trigger
CREATE TRIGGER update_loyalty_milestone_offers_updated_at
BEFORE UPDATE ON public.loyalty_milestone_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_psychological_engines_updated_at
BEFORE UPDATE ON public.psychological_engines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();