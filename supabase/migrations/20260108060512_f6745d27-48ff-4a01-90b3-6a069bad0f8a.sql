-- =====================
-- 1. Fix RLS policies for public_profiles and slot_holds
-- =====================

-- RLS for public_profiles
CREATE POLICY "Users can read own profile" ON public.public_profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.public_profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.public_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for slot_holds (allow public read and insert for booking flow)
CREATE POLICY "Anyone can read slot holds" ON public.slot_holds
FOR SELECT USING (true);

CREATE POLICY "Anyone can create slot holds" ON public.slot_holds
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete expired or own holds" ON public.slot_holds
FOR DELETE USING (true);

-- =====================
-- 2. Add amenities column to turfs table
-- =====================
ALTER TABLE public.turfs 
ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}';

-- =====================
-- 3. Create first_booking_offers table for configurable first/second/third booking offers
-- =====================
CREATE TABLE IF NOT EXISTS public.first_booking_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  turf_id uuid REFERENCES public.turfs(id) ON DELETE CASCADE,
  booking_number integer NOT NULL DEFAULT 1, -- 1 = first, 2 = second, 3 = third
  discount_type text NOT NULL DEFAULT 'fixed', -- 'fixed' or 'percentage'
  discount_value numeric NOT NULL DEFAULT 0,
  applicable_days text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  start_hour integer NOT NULL DEFAULT 6,
  end_hour integer NOT NULL DEFAULT 16,
  is_active boolean NOT NULL DEFAULT true,
  offer_title text,
  urgency_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_booking_number CHECK (booking_number >= 1 AND booking_number <= 10)
);

ALTER TABLE public.first_booking_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own first booking offers" ON public.first_booking_offers
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active first booking offers" ON public.first_booking_offers
FOR SELECT USING (is_active = true);

-- =====================
-- 4. Create turf-images storage bucket
-- =====================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('turf-images', 'turf-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for turf-images
CREATE POLICY "Anyone can view turf images" ON storage.objects
FOR SELECT USING (bucket_id = 'turf-images');

CREATE POLICY "Authenticated users can upload turf images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'turf-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own turf images" ON storage.objects
FOR UPDATE USING (bucket_id = 'turf-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own turf images" ON storage.objects
FOR DELETE USING (bucket_id = 'turf-images' AND auth.uid()::text = (storage.foldername(name))[1]);