-- Add loyalty points column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_tier text DEFAULT 'bronze';

-- Create loyalty_transactions table to track point history
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  points integer NOT NULL,
  transaction_type text NOT NULL, -- 'earn', 'redeem', 'expire', 'bonus'
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_transactions
CREATE POLICY "Users can view own loyalty transactions" ON public.loyalty_transactions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loyalty transactions" ON public.loyalty_transactions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own loyalty transactions" ON public.loyalty_transactions 
FOR DELETE USING (auth.uid() = user_id);

-- Create loyalty_rewards table for configurable rewards
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  points_required integer NOT NULL,
  reward_type text NOT NULL, -- 'discount_percent', 'discount_flat', 'free_hour'
  reward_value numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_rewards
CREATE POLICY "Users can view own loyalty rewards" ON public.loyalty_rewards 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loyalty rewards" ON public.loyalty_rewards 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loyalty rewards" ON public.loyalty_rewards 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loyalty rewards" ON public.loyalty_rewards 
FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_loyalty_rewards_updated_at
BEFORE UPDATE ON public.loyalty_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create booking_tickets table for QR codes
CREATE TABLE IF NOT EXISTS public.booking_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  ticket_code text NOT NULL UNIQUE,
  qr_data text NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS (tickets should be publicly viewable by ticket code)
ALTER TABLE public.booking_tickets ENABLE ROW LEVEL SECURITY;

-- Allow public to view tickets (for QR scanning)
CREATE POLICY "Anyone can view tickets by code" ON public.booking_tickets 
FOR SELECT USING (true);

-- Allow public to create tickets (for public bookings)
CREATE POLICY "Anyone can create tickets" ON public.booking_tickets 
FOR INSERT WITH CHECK (true);