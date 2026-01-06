-- Add hourly pricing columns to turfs
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS price_1h numeric;
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS price_2h numeric;
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS price_3h numeric;
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS weekday_price numeric;
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Create RLS policy for public turf viewing (allow unauthenticated access)
CREATE POLICY "Anyone can view public turfs" 
ON public.turfs 
FOR SELECT 
USING (is_public = true);

-- Allow public bookings insertion for landing page
CREATE POLICY "Allow public booking creation"
ON public.bookings
FOR INSERT
WITH CHECK (true);

-- Allow public customer creation
CREATE POLICY "Allow public customer creation"
ON public.customers
FOR INSERT
WITH CHECK (true);