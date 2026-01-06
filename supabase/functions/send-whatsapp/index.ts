import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'booking_confirmation' | 'booking_reminder' | 'booking_cancelled';
  customerName?: string;
  turfName?: string;
  bookingDate?: string;
  bookingTime?: string;
  amount?: number;
  ticketCode?: string;
}

// WhatsApp Business API integration
// Set WHATSAPP_BUSINESS_API_KEY and WHATSAPP_PHONE_NUMBER_ID in Supabase secrets
const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_BUSINESS_API_KEY');
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, type, customerName, turfName, bookingDate, bookingTime, amount, ticketCode } = await req.json() as WhatsAppMessage;

    // Format phone number for WhatsApp (remove spaces, add country code if needed)
    let formattedPhone = to.replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone;
    }

    console.log(`[WhatsApp] Preparing ${type} notification for ${formattedPhone}`);
    console.log(`[WhatsApp] Customer: ${customerName}, Turf: ${turfName}`);

    // Check if WhatsApp Business API is configured
    if (WHATSAPP_API_KEY && WHATSAPP_PHONE_ID) {
      console.log('[WhatsApp] Using WhatsApp Business API');
      
      // Construct message template based on type
      let templateName = 'booking_confirmation';
      let templateComponents: any[] = [];
      
      if (type === 'booking_confirmation') {
        templateName = 'booking_confirmation';
        templateComponents = [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName || 'Customer' },
              { type: 'text', text: turfName || 'Turf' },
              { type: 'text', text: bookingDate || 'Date' },
              { type: 'text', text: bookingTime || 'Time' },
              { type: 'text', text: `₹${amount || 0}` },
              { type: 'text', text: ticketCode || '' },
            ]
          }
        ];
      } else if (type === 'booking_reminder') {
        templateName = 'booking_reminder';
        templateComponents = [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName || 'Customer' },
              { type: 'text', text: turfName || 'Turf' },
              { type: 'text', text: bookingDate || 'Date' },
              { type: 'text', text: bookingTime || 'Time' },
            ]
          }
        ];
      } else if (type === 'booking_cancelled') {
        templateName = 'booking_cancelled';
        templateComponents = [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName || 'Customer' },
              { type: 'text', text: turfName || 'Turf' },
              { type: 'text', text: bookingDate || 'Date' },
            ]
          }
        ];
      }

      try {
        // Send via WhatsApp Business API
        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: formattedPhone,
              type: 'template',
              template: {
                name: templateName,
                language: { code: 'en' },
                components: templateComponents
              }
            }),
          }
        );

        const responseData = await whatsappResponse.json();
        console.log('[WhatsApp] API Response:', JSON.stringify(responseData));

        if (whatsappResponse.ok) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              messageId: responseData.messages?.[0]?.id,
              method: 'whatsapp_business_api',
              message: "WhatsApp notification sent successfully via Business API."
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          console.error('[WhatsApp] API Error:', responseData);
          throw new Error(responseData.error?.message || 'WhatsApp API error');
        }
      } catch (apiError) {
        console.error('[WhatsApp] Business API failed, falling back to wa.me link:', apiError);
      }
    }

    // Fallback: Generate wa.me link for manual sending
    console.log('[WhatsApp] Using fallback wa.me link method');
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        whatsappUrl,
        method: 'wa_me_link',
        message: "WhatsApp notification prepared. Configure WHATSAPP_BUSINESS_API_KEY and WHATSAPP_PHONE_NUMBER_ID for automated sending."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[WhatsApp] Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});