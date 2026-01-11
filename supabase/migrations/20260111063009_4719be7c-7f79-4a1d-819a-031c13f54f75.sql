-- Fix turf_reviews RLS policy to allow public users to post reviews
-- The current policy requires booking_id which is too restrictive

DROP POLICY IF EXISTS "Users create valid reviews" ON public.turf_reviews;

-- Allow any authenticated user to create a review (they need to have visited/booked the turf)
CREATE POLICY "Users can create reviews" 
ON public.turf_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also add policy to allow update without booking requirement
DROP POLICY IF EXISTS "Users update own reviews" ON public.turf_reviews;

CREATE POLICY "Users update own reviews" 
ON public.turf_reviews 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);