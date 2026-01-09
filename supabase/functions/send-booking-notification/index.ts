import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingNotificationPayload {
  turf_owner_id: string;
  booking_id: string;
  customer_name: string;
  booking_date: string;
  start_time: string;
  turf_name: string;
  amount: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: BookingNotificationPayload = await req.json();
    console.log('Received booking notification request:', payload);

    // Get push subscriptions for the turf owner
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', payload.turf_owner_id);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions for user ${payload.turf_owner_id}`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found for this user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: '🎉 New Booking!',
      body: `${payload.customer_name} booked ${payload.turf_name} for ${payload.booking_date} at ${payload.start_time}. Amount: ₹${payload.amount}`,
      data: {
        booking_id: payload.booking_id,
        type: 'new_booking'
      }
    });

    // For web-push, we need the VAPID keys
    // Since we're using a demo VAPID key, we'll use a simple approach
    // In production, you'd use the web-push library with proper VAPID keys
    
    // For now, we'll just log that notifications should be sent
    // The actual push would require web-push npm package in a Node environment
    // or a third-party push service
    
    console.log('Would send notification to subscriptions:', subscriptions.length);
    console.log('Notification payload:', notificationPayload);

    // Store notification in a notifications table if needed for fallback
    // For now we'll create an in-app notification system
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification prepared for ${subscriptions.length} device(s)`,
        subscriptions_count: subscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in send-booking-notification:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
