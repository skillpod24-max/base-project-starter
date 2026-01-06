-- Create public_profiles table if not exists
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  loyalty_points integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  favorite_sport text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on public_profiles
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.public_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.public_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.public_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.public_profiles;

-- Create RLS policies for public_profiles
CREATE POLICY "Users can view own profile" ON public.public_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.public_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.public_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create user_roles table if not exists  
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'manager');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create turf_reviews table for star ratings and feedback
CREATE TABLE IF NOT EXISTS public.turf_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id uuid REFERENCES public.turfs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(booking_id)
);

ALTER TABLE public.turf_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.turf_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON public.turf_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.turf_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.turf_reviews FOR DELETE USING (auth.uid() = user_id);

-- Add enhanced offer fields to offers table
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS offer_type text DEFAULT 'discount';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS offer_title text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS urgency_text text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS show_hours_before integer;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS max_redemptions integer;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS min_players integer;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS first_come_limit integer;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS turf_id uuid REFERENCES public.turfs(id) ON DELETE CASCADE;

-- Add cancellation fields to bookings if not exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_by uuid;

-- Add coordinates to turfs for accurate distance calculation
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS longitude numeric;

-- Add average rating to turfs (computed)
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS avg_rating numeric DEFAULT 0;
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Create trigger to update turf avg_rating when reviews change
CREATE OR REPLACE FUNCTION public.update_turf_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.turfs
    SET 
      avg_rating = COALESCE((SELECT AVG(rating)::numeric FROM public.turf_reviews WHERE turf_id = OLD.turf_id), 0),
      review_count = (SELECT COUNT(*) FROM public.turf_reviews WHERE turf_id = OLD.turf_id)
    WHERE id = OLD.turf_id;
    RETURN OLD;
  ELSE
    UPDATE public.turfs
    SET 
      avg_rating = COALESCE((SELECT AVG(rating)::numeric FROM public.turf_reviews WHERE turf_id = NEW.turf_id), 0),
      review_count = (SELECT COUNT(*) FROM public.turf_reviews WHERE turf_id = NEW.turf_id)
    WHERE id = NEW.turf_id;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_turf_rating_trigger ON public.turf_reviews;
CREATE TRIGGER update_turf_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.turf_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_turf_rating();

-- Create trigger for public_profiles updated_at
CREATE TRIGGER update_public_profiles_updated_at
BEFORE UPDATE ON public.public_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();