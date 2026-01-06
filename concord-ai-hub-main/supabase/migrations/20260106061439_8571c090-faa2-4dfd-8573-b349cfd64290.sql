-- Add time-decay pricing and smart offer fields to offers table
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS revenue_strategy text DEFAULT 'fill_empty_slots',
ADD COLUMN IF NOT EXISTS time_decay_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS time_decay_days text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS time_decay_hours text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_time_decay_discount numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_decay_discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS decay_stage text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS slot_demand_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

-- Add bookings_from_offer count for analytics
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS revenue_from_offer numeric DEFAULT 0;

-- Create push notification subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions
FOR DELETE USING (auth.uid() = user_id);

-- Add offer analytics tracking
CREATE TABLE IF NOT EXISTS public.offer_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  turf_id uuid REFERENCES public.turfs(id) ON DELETE SET NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  session_id text,
  converted boolean DEFAULT false
);

-- Enable RLS on offer_views
ALTER TABLE public.offer_views ENABLE ROW LEVEL SECURITY;

-- Anyone can create views, owners can read their offer views
CREATE POLICY "Anyone can insert offer views" ON public.offer_views
FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can view their offer analytics" ON public.offer_views
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.offers WHERE offers.id = offer_views.offer_id AND offers.user_id = auth.uid())
);