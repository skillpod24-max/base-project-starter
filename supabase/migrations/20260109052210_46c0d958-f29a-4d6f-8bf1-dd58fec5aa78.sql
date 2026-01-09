-- Previous migration failed with: ERROR:  42601: syntax error at or near "NOT" (CREATE POLICY IF NOT EXISTS ...)
-- Postgres does not support IF NOT EXISTS for CREATE POLICY.

-- 1) Fix INSERT policy for bookings so public users can create bookings for public turfs
-- while managers can still create bookings for their own turfs.
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
CREATE POLICY "Public can create bookings"
ON public.bookings
FOR INSERT
TO public
WITH CHECK (
  -- Manager/admin creating their own booking in dashboard
  auth.uid() = bookings.user_id
  OR
  -- Public customer booking on a public turf: booking.user_id must match turf owner
  EXISTS (
    SELECT 1
    FROM public.turfs t
    WHERE t.id = bookings.turf_id
      AND t.user_id = bookings.user_id
      AND t.is_public = true
      AND t.is_active = true
  )
);

-- 2) Allow customers to read *their* bookings (needed because the public flow uses
-- insert(...).select().single() which requires SELECT on the inserted row)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Customers can view own bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT TO public USING ( auth.uid() = user_id OR EXISTS ( SELECT 1 FROM public.customers c JOIN public.public_profiles p ON p.user_id = auth.uid() WHERE c.id = bookings.customer_id AND c.phone = p.phone ) )';
  END IF;
END $$;