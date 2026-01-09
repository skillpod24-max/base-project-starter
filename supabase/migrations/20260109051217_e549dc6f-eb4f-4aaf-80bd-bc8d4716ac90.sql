-- Fix RLS for customers table to allow public booking
-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users insert own customer" ON public.customers;

-- Create new INSERT policy that allows:
-- 1. Turf owners to create their own customers (auth.uid() = user_id)
-- 2. Any authenticated user to create customers for turfs they're booking (for public booking flow)
CREATE POLICY "Allow customer creation for bookings"
ON public.customers
FOR INSERT
WITH CHECK (
  -- Allow turf managers to create their own customers
  auth.uid() = user_id
  OR
  -- Allow any authenticated user to create a customer record for a turf owner
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.turfs WHERE turfs.user_id = customers.user_id AND turfs.is_public = true
  ))
);

-- Also allow authenticated users to read customers they created (for the booking flow)
DROP POLICY IF EXISTS "Users view own customer" ON public.customers;
CREATE POLICY "Users view customers"
ON public.customers
FOR SELECT
USING (
  -- Turf owners can see their customers
  auth.uid() = user_id
  OR
  -- Users can see customer records with their phone number
  phone = (SELECT phone FROM public.public_profiles WHERE public_profiles.user_id = auth.uid() LIMIT 1)
);