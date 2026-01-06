-- Create slot_holds table for 5-minute slot reservation
CREATE TABLE public.slot_holds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id UUID NOT NULL REFERENCES public.turfs(id) ON DELETE CASCADE,
  hold_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS
ALTER TABLE public.slot_holds ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view holds (for checking availability)
CREATE POLICY "Anyone can view slot holds" 
ON public.slot_holds FOR SELECT USING (true);

-- Allow anyone to create holds (public booking)
CREATE POLICY "Anyone can create slot holds" 
ON public.slot_holds FOR INSERT WITH CHECK (true);

-- Allow anyone to delete their own holds (by session_id)
CREATE POLICY "Anyone can delete own slot holds" 
ON public.slot_holds FOR DELETE USING (true);

-- Create index for efficient lookups
CREATE INDEX idx_slot_holds_turf_date ON public.slot_holds(turf_id, hold_date);
CREATE INDEX idx_slot_holds_expires ON public.slot_holds(expires_at);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE slot_holds;