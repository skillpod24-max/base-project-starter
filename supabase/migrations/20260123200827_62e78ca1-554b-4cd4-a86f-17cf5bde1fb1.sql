-- Add scratch card configuration to turf_engines table
ALTER TABLE public.turf_engines
ADD COLUMN IF NOT EXISTS scratch_card_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS scratch_card_delay_seconds INTEGER DEFAULT 10;