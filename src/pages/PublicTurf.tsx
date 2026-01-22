import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowLeft, ChevronLeft, ChevronRight, Calendar, Phone, Loader2, Check, Sparkles, Timer, AlertCircle, Award, Tag, ExternalLink, MessageCircle, Percent, LogIn, Star, Wifi, Car, Droplets, ShowerHead, Coffee, Dumbbell, Shield, Sun, Wind, TrendingDown, Gift, Trophy, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { BookingTicket } from '@/components/BookingTicket';
import { usePublicAuth } from '@/hooks/usePublicAuth';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { TurfReviews } from '@/components/TurfReviews';
import { OfferHighlight } from '@/components/OfferHighlight';
import { FirstBookingOfferBanner } from '@/components/FirstBookingOfferBanner';
import { ProgressiveHourUpsell } from '@/components/ProgressiveHourUpsell';
import { LoyaltyProgressBar } from '@/components/LoyaltyProgressBar';
import { OfferMiniBar } from '@/components/turf/OfferMiniBar';
import { ConversionTriggers } from '@/components/turf/ConversionTriggers';
import { ScratchCardOffer } from '@/components/turf/ScratchCardOffer';

interface Turf {
  id: string;
  user_id: string;
  name: string;
  sport_type: string;
  location: string | null;
  description: string | null;
  images: string[] | null;
  amenities: string[] | null;
  base_price: number;
  price_1h: number | null;
  price_2h: number | null;
  price_3h: number | null;
  weekday_price: number | null;
  weekend_price: number | null;
  peak_hour_price: number | null;
  operating_hours_start: string;
  operating_hours_end: string;
  slot_duration: number;
  google_maps_url: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  avg_rating: number | null;
  review_count: number | null;
}

interface Booking {
  booking_date: string;
  start_time: string;
  end_time: string;
}

interface BlockedSlot {
  block_date: string;
  start_time: string;
  end_time: string;
}

interface SlotHold {
  id: string;
  hold_date: string;
  start_time: string;
  end_time: string;
  session_id: string;
  expires_at: string;
}

interface Offer {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  applicable_days: string[] | null;
  applicable_hours: string[] | null;
}

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_booking_amount: number | null;
  max_discount: number | null;
}

interface FirstBookingOffer {
  id: string;
  booking_number: number;
  discount_type: string;
  discount_value: number;
  applicable_days: string[] | null;
  start_hour: number;
  end_hour: number;
  offer_title: string | null;
  urgency_text: string | null;
}

interface LoyaltyMilestoneOffer {
  id: string;
  milestone_booking_count: number;
  reward_type: string;
  reward_value: number;
  free_hour_on_duration: number | null;
  title: string | null;
  description: string | null;
}

interface TicketData {
  booking: any;
  turf: { name: string; sport_type: string; location: string | null };
  customer: { name: string; phone: string };
  ticketCode: string;
}

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('booking_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('booking_session_id', sessionId);
  }
  return sessionId;
};

const HOLD_DURATION_SECONDS = 300;

export default function PublicTurf() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = usePublicAuth();
  
  const [turf, setTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [slotHolds, setSlotHolds] = useState<SlotHold[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [duration, setDuration] = useState('1');
  const [booking, setBooking] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [holdTimer, setHoldTimer] = useState<number>(0);
  const [currentHoldId, setCurrentHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [firstBookingOffers, setFirstBookingOffers] = useState<FirstBookingOffer[]>([]);
  const [loyaltyMilestoneOffers, setLoyaltyMilestoneOffers] = useState<LoyaltyMilestoneOffer[]>([]);
  const [customerBookingCount, setCustomerBookingCount] = useState(0);
  const [showScratchCard, setShowScratchCard] = useState(false);
  const [scratchCardDismissed, setScratchCardDismissed] = useState(false);

  const sessionId = getSessionId();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      fetchTurf();
    }
  }, [id]);

  useEffect(() => {
    if (turf) {
      fetchOffers();
      fetchFirstBookingOffers();
      fetchLoyaltyMilestoneOffers();
    }
  }, [turf]);

  // Fetch customer booking count for first booking offer eligibility
  useEffect(() => {
    if (turf && profile?.phone) {
      fetchCustomerBookingCount();
    }
  }, [turf, profile?.phone]);

  // Track offer views when offers load
  useEffect(() => {
    if (offers.length > 0 && turf) {
      offers.forEach(offer => {
        // Track view (non-blocking)
        (supabase as any)
          .from('offer_views')
          .insert({
            offer_id: offer.id,
            turf_id: turf.id,
            session_id: sessionId,
            converted: false
          })
          .then(() => {
            // Also increment views_count on offer
            supabase
              .from('offers')
              .update({ views_count: ((offer as any).views_count || 0) + 1 })
              .eq('id', offer.id);
          });
      });
    }
  }, [offers, turf]);

  useEffect(() => {
    if (turf) {
      fetchBookings();
      fetchBlockedSlots();
      fetchSlotHolds();
      const unsubscribe = subscribeToHolds();
      const unsubscribeBookings = subscribeToBookings();
      
      return () => {
        if (unsubscribe) unsubscribe();
        if (unsubscribeBookings) unsubscribeBookings();
      };
    }
  }, [turf, currentDate]);

  // Background-safe timer using expires_at timestamp
  useEffect(() => {
    if (holdExpiresAt) {
      const updateTimer = () => {
        const now = new Date();
        const remainingMs = holdExpiresAt.getTime() - now.getTime();
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        
        if (remainingSeconds <= 0) {
          handleHoldExpired();
          setHoldTimer(0);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
        } else {
          setHoldTimer(remainingSeconds);
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    } else {
      setHoldTimer(0);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [holdExpiresAt]);

  const fetchTurf = async () => {
    const { data } = await supabase
      .from('turfs')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single();
    
    setTurf(data);
    setLoading(false);
  };

  const fetchOffers = async () => {
    if (!turf) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', today)
      .gte('valid_until', today)
      .or(`turf_id.eq.${turf.id},turf_id.is.null,user_id.eq.${turf.user_id}`);
    
    // Filter to only turf-specific or user's general offers
    const filteredOffers = (data || []).filter(o => 
      o.turf_id === turf.id || (o.turf_id === null && o.user_id === turf.user_id)
    );
    setOffers(filteredOffers);
  };

  const fetchFirstBookingOffers = async () => {
    if (!turf) return;
    const { data } = await (supabase as any)
      .from('first_booking_offers')
      .select('*')
      .eq('is_active', true)
      .eq('user_id', turf.user_id)
      .or(`turf_id.eq.${turf.id},turf_id.is.null`);
    
    setFirstBookingOffers(data || []);
  };

  const fetchLoyaltyMilestoneOffers = async () => {
    if (!turf) return;
    const { data } = await supabase
      .from('loyalty_milestone_offers')
      .select('*')
      .eq('is_active', true)
      .eq('user_id', turf.user_id)
      .or(`turf_id.eq.${turf.id},turf_id.is.null`)
      .order('milestone_booking_count', { ascending: true });
    
    setLoyaltyMilestoneOffers((data || []) as LoyaltyMilestoneOffer[]);
  };

  const fetchCustomerBookingCount = async () => {
    if (!turf || !profile?.phone) return;
    
    // Get customer record for this turf owner matching user's phone
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', profile.phone)
      .eq('user_id', turf.user_id);
    
    if (!customers || customers.length === 0) {
      setCustomerBookingCount(0);
      return;
    }
    
    // Count completed bookings for this customer on this turf
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customers[0].id)
      .eq('turf_id', turf.id)
      .neq('status', 'cancelled');
    
    setCustomerBookingCount(count || 0);
  };

  const fetchBookings = async () => {
    if (!turf) return;
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const { data } = await supabase
      .from('bookings')
      .select('booking_date, start_time, end_time')
      .eq('turf_id', turf.id)
      .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
      .neq('status', 'cancelled');

    setBookings(data || []);
  };

  const fetchBlockedSlots = async () => {
    if (!turf) return;
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const { data } = await supabase
      .from('blocked_slots')
      .select('block_date, start_time, end_time')
      .eq('turf_id', turf.id)
      .gte('block_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('block_date', format(weekEnd, 'yyyy-MM-dd'));

    setBlockedSlots(data || []);
  };

  const fetchSlotHolds = async () => {
    if (!turf) return;
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const { data } = await supabase
      .from('slot_holds')
      .select('*')
      .eq('turf_id', turf.id)
      .gte('hold_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('hold_date', format(weekEnd, 'yyyy-MM-dd'))
      .gt('expires_at', new Date().toISOString());

    setSlotHolds(data || []);
  };

  const subscribeToHolds = () => {
    if (!turf) return;
    
    const channel = supabase
      .channel(`slot-holds-${turf.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'slot_holds', filter: `turf_id=eq.${turf.id}` },
        () => {
          fetchSlotHolds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToBookings = () => {
    if (!turf) return;
    
    const channel = supabase
      .channel(`bookings-${turf.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `turf_id=eq.${turf.id}` },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleHoldExpired = useCallback(async () => {
    if (currentHoldId) {
      await supabase.from('slot_holds').delete().eq('id', currentHoldId);
      setCurrentHoldId(null);
      setHoldExpiresAt(null);
      setSelectedSlot(null);
      toast({
        title: 'Hold Expired',
        description: 'Your slot hold has expired. Please select again.',
        variant: 'destructive'
      });
    }
  }, [currentHoldId, toast]);

  const generateTimeSlots = () => {
    if (!turf) return [];
    const slots: string[] = [];
    const [startH] = turf.operating_hours_start.split(':').map(Number);
    let [endH] = turf.operating_hours_end.split(':').map(Number);
    
    if (endH === 0) endH = 24;

    for (let h = startH; h < endH; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const isSlotBooked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotHour = parseInt(time.split(':')[0]);
    return bookings.some(b => {
      if (b.booking_date !== dateStr) return false;
      const startHour = parseInt(b.start_time.split(':')[0]);
      const endHour = parseInt(b.end_time.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  const isSlotBlocked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotHour = parseInt(time.split(':')[0]);
    return blockedSlots.some(b => {
      if (b.block_date !== dateStr) return false;
      const startHour = parseInt(b.start_time.split(':')[0]);
      const endHour = parseInt(b.end_time.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  const isSlotHeld = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotHour = parseInt(time.split(':')[0]);
    const now = new Date();
    
    return slotHolds.some(h => {
      if (h.hold_date !== dateStr) return false;
      if (h.session_id === sessionId) return false;
      if (new Date(h.expires_at) < now) return false;
      const startHour = parseInt(h.start_time.split(':')[0]);
      const endHour = parseInt(h.end_time.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  const isSlotPast = (date: Date, time: string) => {
    const now = new Date();
    const slotDate = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`);
    return slotDate < now;
  };

  const handleSlotSelect = async (date: Date, time: string) => {
    if (!turf) return;

    // Require login to book
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login or create an account to book a slot.',
        variant: 'destructive'
      });
      navigate('/public-auth');
      return;
    }

    if (currentHoldId) {
      await supabase.from('slot_holds').delete().eq('id', currentHoldId);
    }

    const hours = parseInt(duration);
    const startHour = parseInt(time.split(':')[0]);
    const endTime = `${(startHour + hours).toString().padStart(2, '0')}:00`;
    const expiresAt = new Date(Date.now() + HOLD_DURATION_SECONDS * 1000);

    // Check all hours for the selected duration
    for (let h = startHour; h < startHour + hours; h++) {
      const checkTime = `${h.toString().padStart(2, '0')}:00`;
      if (isSlotBooked(date, checkTime) || isSlotBlocked(date, checkTime) || isSlotHeld(date, checkTime)) {
        toast({
          title: 'Slot Unavailable',
          description: `The ${hours}-hour slot is not fully available.`,
          variant: 'destructive'
        });
        return;
      }
    }

    const { data: holdData, error } = await supabase
      .from('slot_holds')
      .insert({
        turf_id: turf.id,
        hold_date: format(date, 'yyyy-MM-dd'),
        start_time: time,
        end_time: endTime,
        session_id: sessionId,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Unable to Hold Slot',
        description: 'This slot may have just been taken.',
        variant: 'destructive'
      });
      fetchSlotHolds();
      return;
    }

    setCurrentHoldId(holdData.id);
    setHoldExpiresAt(expiresAt);
    setSelectedSlot({ date, time });
    
    toast({
      title: 'Slot Held!',
      description: 'Complete your booking within 5 minutes.',
    });
  };

  const handleDurationChange = async (newDuration: string) => {
    setDuration(newDuration);
    
    if (selectedSlot && currentHoldId) {
      const newHours = parseInt(newDuration);
      const startHour = parseInt(selectedSlot.time.split(':')[0]);
      
      // Check if all slots are available for new duration
      for (let h = startHour; h < startHour + newHours; h++) {
        const checkTime = `${h.toString().padStart(2, '0')}:00`;
        if (isSlotBooked(selectedSlot.date, checkTime) || isSlotBlocked(selectedSlot.date, checkTime) || isSlotHeld(selectedSlot.date, checkTime)) {
          toast({
            title: 'Duration Not Available',
            description: `Cannot extend to ${newDuration} hours - some slots are unavailable.`,
            variant: 'destructive'
          });
          return;
        }
      }
      
      // Update the hold in database with new end time
      const endTime = `${(startHour + newHours).toString().padStart(2, '0')}:00`;
      await supabase
        .from('slot_holds')
        .update({ end_time: endTime })
        .eq('id', currentHoldId);
      
      fetchSlotHolds();
    }
  };

  const getApplicableOffer = () => {
    if (!selectedSlot || offers.length === 0) return null;

    const dayOfWeek = format(selectedSlot.date, 'EEEE');
    const hour = selectedSlot.time.split(':')[0];

    for (const offer of offers) {
      const dayMatch = !offer.applicable_days || offer.applicable_days.length === 0 || offer.applicable_days.includes(dayOfWeek);
      const hourMatch = !offer.applicable_hours || offer.applicable_hours.length === 0 || offer.applicable_hours.includes(hour);
      
      if (dayMatch && hourMatch) {
        return offer;
      }
    }
    return null;
  };

  const getApplicableFirstBookingOffer = (): FirstBookingOffer | null => {
    if (!selectedSlot || firstBookingOffers.length === 0) return null;

    const dayOfWeek = format(selectedSlot.date, 'EEEE');
    const hour = parseInt(selectedSlot.time.split(':')[0]);

    // Find offer matching next booking number for this customer
    const nextBookingNumber = customerBookingCount + 1;

    for (const offer of firstBookingOffers) {
      if (offer.booking_number !== nextBookingNumber) continue;
      
      const dayMatch = !offer.applicable_days || offer.applicable_days.length === 0 || offer.applicable_days.includes(dayOfWeek);
      const hourMatch = hour >= offer.start_hour && hour < offer.end_hour;
      
      if (dayMatch && hourMatch) {
        return offer;
      }
    }
    return null;
  };

  // Get applicable loyalty milestone offer based on customer's completed bookings at this venue
  const getApplicableLoyaltyMilestoneOffer = (): LoyaltyMilestoneOffer | null => {
    if (loyaltyMilestoneOffers.length === 0) return null;
    
    // Next booking number (current + 1 for the booking being made)
    const nextBookingNumber = customerBookingCount + 1;
    
    // Find milestone that exactly matches the next booking count
    const matchingMilestone = loyaltyMilestoneOffers.find(
      m => m.milestone_booking_count === nextBookingNumber
    );
    
    return matchingMilestone || null;
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim() || !turf) return;
    
    setApplyingPromo(true);
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .eq('is_active', true)
      .lte('valid_from', new Date().toISOString().split('T')[0])
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .maybeSingle();

    if (data) {
      if (data.turf_id && data.turf_id !== turf.id) {
        toast({ title: 'Invalid Code', description: 'This promo code is not valid for this turf.', variant: 'destructive' });
      } else if (data.usage_limit && data.used_count >= data.usage_limit) {
        toast({ title: 'Code Expired', description: 'This promo code has reached its usage limit.', variant: 'destructive' });
      } else {
        setAppliedPromo(data);
        toast({ title: 'Promo Applied!', description: `You got ${data.discount_type === 'percentage' ? `${data.discount_value}% off` : `₹${data.discount_value} off`}` });
      }
    } else {
      toast({ title: 'Invalid Code', description: 'This promo code is invalid or expired.', variant: 'destructive' });
    }
    setApplyingPromo(false);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const calculatePrice = () => {
    if (!turf || !selectedSlot) return { base: 0, discount: 0, final: 0, savingsPercent: 0, discountSource: '', loyaltyReward: null as LoyaltyMilestoneOffer | null };
    const hours = parseInt(duration);
    const day = selectedSlot.date.getDay();
    const isWeekend = day === 0 || day === 6;
    const hour = parseInt(selectedSlot.time.split(':')[0]);
    const isPeakHour = hour >= 17 && hour <= 21;

    let basePrice = 0;
    
    if (hours === 1 && turf.price_1h) {
      basePrice = turf.price_1h;
    } else if (hours === 2 && turf.price_2h) {
      basePrice = turf.price_2h;
    } else if (hours === 3 && turf.price_3h) {
      basePrice = turf.price_3h;
    } else {
      let hourlyRate = turf.base_price;
      
      if (isWeekend && turf.weekend_price) {
        hourlyRate = turf.weekend_price;
      } else if (!isWeekend && turf.weekday_price) {
        hourlyRate = turf.weekday_price;
      }
      
      if (isPeakHour && turf.peak_hour_price) {
        hourlyRate = turf.peak_hour_price;
      }
      
      basePrice = hourlyRate * hours;
    }

    let discount = 0;
    let discountSource = '';
    let loyaltyReward: LoyaltyMilestoneOffer | null = null;
    
    // Check for loyalty milestone offer first (highest priority)
    const loyaltyMilestoneOffer = getApplicableLoyaltyMilestoneOffer();
    if (loyaltyMilestoneOffer) {
      loyaltyReward = loyaltyMilestoneOffer;
      
      if (loyaltyMilestoneOffer.reward_type === 'free_hour') {
        // Free hour applies if booking duration matches requirement
        const requiredDuration = loyaltyMilestoneOffer.free_hour_on_duration || hours;
        if (hours >= requiredDuration) {
          // Deduct one hour's worth
          const oneHourPrice = basePrice / hours;
          discount = oneHourPrice;
          discountSource = 'loyalty_milestone';
        }
      } else if (loyaltyMilestoneOffer.reward_type === 'percentage') {
        discount = Math.round(basePrice * loyaltyMilestoneOffer.reward_value / 100);
        discountSource = 'loyalty_milestone';
      } else if (loyaltyMilestoneOffer.reward_type === 'discount') {
        discount = loyaltyMilestoneOffer.reward_value;
        discountSource = 'loyalty_milestone';
      }
    }
    
    // Check for first booking offer (second priority, don't stack with loyalty)
    const firstBookingOffer = getApplicableFirstBookingOffer();
    if (firstBookingOffer && !loyaltyMilestoneOffer) {
      if (firstBookingOffer.discount_type === 'percentage') {
        discount = Math.round(basePrice * firstBookingOffer.discount_value / 100);
      } else {
        discount = firstBookingOffer.discount_value;
      }
      discountSource = 'first_booking';
    }
    
    // Then check for general offers (don't stack with above)
    const offer = getApplicableOffer();
    if (offer && !firstBookingOffer && !loyaltyMilestoneOffer) {
      if (offer.discount_type === 'percentage') {
        discount = Math.round(basePrice * offer.discount_value / 100);
      } else {
        discount = offer.discount_value;
      }
      discountSource = 'offer';
    }

    // Promo codes stack on top of all other discounts
    if (appliedPromo && basePrice >= (appliedPromo.min_booking_amount || 0)) {
      let promoDiscount = 0;
      if (appliedPromo.discount_type === 'percentage') {
        promoDiscount = Math.round(basePrice * appliedPromo.discount_value / 100);
        if (appliedPromo.max_discount) {
          promoDiscount = Math.min(promoDiscount, appliedPromo.max_discount);
        }
      } else {
        promoDiscount = appliedPromo.discount_value;
      }
      discount += promoDiscount;
    }

    const savingsPercent = basePrice > 0 ? Math.round((discount / basePrice) * 100) : 0;

    return {
      base: basePrice,
      discount,
      final: Math.max(0, basePrice - discount),
      savingsPercent,
      discountSource,
      loyaltyReward
    };
  };

  const calculateEndTime = (startTime: string, hours: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const endH = h + hours;
    return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const generateTicketCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TM';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const calculateLoyaltyPoints = (amount: number) => {
    return Math.floor(amount / 100) * 10;
  };

  const handleBooking = async () => {
    if (!turf || !selectedSlot || !user || !profile) {
      toast({ title: 'Error', description: 'Please login to continue', variant: 'destructive' });
      return;
    }

    setBooking(true);

    const pricing = calculatePrice();
    const totalAmount = pricing.final;
    const loyaltyPointsEarned = calculateLoyaltyPoints(totalAmount);
    const customerName = profile.name;
    const customerPhone = profile.phone;

    // Find or create customer for this turf manager
    let customerId: string | undefined;
    
    // First check if customer already exists for this turf owner with matching phone
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id, total_bookings, total_spent, loyalty_points, user_id')
      .eq('phone', customerPhone)
      .eq('user_id', turf.user_id);
    
    const existingCustomer = existingCustomers?.[0];
    
    if (existingCustomer) {
      // Customer exists for this turf owner - update stats via RPC or direct update
      customerId = existingCustomer.id;
      // Note: Updates require auth.uid() = user_id, so for public booking we skip stats update
      // Stats will be recalculated from bookings
    } else {
      // Need to create new customer using the public insert policy
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: turf.user_id, // Turf owner's ID - allows through "Allow public customer creation" policy
          name: customerName,
          phone: customerPhone,
          email: profile.email || null,
          total_bookings: 1,
          total_spent: totalAmount,
          last_visit: new Date().toISOString(),
          loyalty_points: loyaltyPointsEarned,
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Customer creation error:', customerError);
        toast({ title: 'Error', description: 'Could not create booking. Please try again.', variant: 'destructive' });
        setBooking(false);
        return;
      }
      customerId = newCustomer.id;
    }

    const offer = getApplicableOffer();

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: turf.user_id,
        turf_id: turf.id,
        customer_id: customerId,
        booking_date: format(selectedSlot.date, 'yyyy-MM-dd'),
        start_time: selectedSlot.time,
        end_time: calculateEndTime(selectedSlot.time, parseInt(duration)),
        sport_type: turf.sport_type,
        total_amount: totalAmount,
        paid_amount: 0,
        payment_status: 'pending',
        status: 'booked',
        discount_amount: pricing.discount,
        offer_id: offer?.id || null,
        promo_code_id: appliedPromo?.id || null,
      })
      .select()
      .single();

    if (bookingError) {
      toast({ title: 'Error', description: bookingError.message, variant: 'destructive' });
      setBooking(false);
      return;
    }

    // Update offer usage count and revenue
    if (offer) {
      await supabase
        .from('offers')
        .update({ 
          usage_count: ((offer as any).usage_count || 0) + 1,
          revenue_from_offer: ((offer as any).revenue_from_offer || 0) + totalAmount
        })
        .eq('id', offer.id);
      
      // Track conversion
      await (supabase as any)
        .from('offer_views')
        .insert({
          offer_id: offer.id,
          turf_id: turf.id,
          session_id: sessionId,
          converted: true
        });
    }

    if (appliedPromo) {
      await supabase
        .from('promo_codes')
        .update({ used_count: (appliedPromo as any).used_count + 1 })
        .eq('id', appliedPromo.id);
    }

    await supabase
      .from('loyalty_transactions')
      .insert({
        user_id: turf.user_id,
        customer_id: customerId,
        booking_id: bookingData.id,
        points: loyaltyPointsEarned,
        transaction_type: 'earn',
        description: `Earned ${loyaltyPointsEarned} points for booking on ${format(selectedSlot.date, 'MMM d, yyyy')}`
      });

    const ticketCode = generateTicketCode();
    await supabase
      .from('booking_tickets')
      .insert({
        booking_id: bookingData.id,
        ticket_code: ticketCode,
        qr_data: JSON.stringify({
          code: ticketCode,
          bookingId: bookingData.id,
          date: bookingData.booking_date,
          time: bookingData.start_time,
        }),
      });

    // Send push notification to turf manager (non-blocking)
    supabase.functions.invoke('send-booking-notification', {
      body: {
        turf_owner_id: turf.user_id,
        booking_id: bookingData.id,
        customer_name: customerName,
        booking_date: format(selectedSlot.date, 'MMM d, yyyy'),
        start_time: selectedSlot.time,
        turf_name: turf.name,
        amount: totalAmount
      }
    }).catch(err => console.log('Push notification error (non-critical):', err));

    if (currentHoldId) {
      await supabase.from('slot_holds').delete().eq('id', currentHoldId);
      setCurrentHoldId(null);
      setHoldExpiresAt(null);
    }

    setTicketData({
      booking: bookingData,
      turf: { name: turf.name, sport_type: turf.sport_type, location: turf.location },
      customer: { name: customerName, phone: customerPhone },
      ticketCode,
    });

    toast({ 
      title: 'Booking Confirmed!', 
      description: `You earned ${loyaltyPointsEarned} loyalty points!` 
    });
    
    setSelectedSlot(null);
    setAppliedPromo(null);
    setPromoCode('');
    fetchBookings();
    fetchSlotHolds();
    setBooking(false);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Turf Not Found</h1>
          <Link to="/" className="text-emerald-600 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();
  const weekDays = getWeekDays();
  const pricing = calculatePrice();
  const applicableOffer = getApplicableOffer();

  // Get the best offer for scratch card (prioritize by discount value)
  const scratchCardOffer = offers.length > 0 ? offers.reduce((best, current) => {
    const bestValue = best.discount_type === 'percentage' ? best.discount_value : best.discount_value / 100;
    const currentValue = current.discount_type === 'percentage' ? current.discount_value : current.discount_value / 100;
    return currentValue > bestValue ? current : best;
  }, offers[0]) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Scratch Card Offer Popup - Shows after 10 seconds */}
      {scratchCardOffer && !scratchCardDismissed && (
        <ScratchCardOffer
          offer={{
            id: scratchCardOffer.id,
            name: scratchCardOffer.name,
            offer_title: (scratchCardOffer as any).offer_title || null,
            description: scratchCardOffer.description,
            discount_type: scratchCardOffer.discount_type,
            discount_value: scratchCardOffer.discount_value,
          }}
          delaySeconds={10}
          onClose={() => setScratchCardDismissed(true)}
          onReveal={() => {
            // Track conversion
            supabase
              .from('offer_views')
              .update({ converted: true })
              .eq('offer_id', scratchCardOffer.id)
              .eq('session_id', sessionId);
          }}
        />
      )}
      {/* Mobile-First Sticky Header - Swiggy Style */}
      <header className="bg-white border-b border-gray-100 py-3 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex-1 text-center px-4">
            <h1 className="text-sm font-semibold text-gray-900 truncate sm:text-base">{turf.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">
              <Share2 className="w-4 h-4" />
            </button>
            <ProfileAvatar />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-4 order-1">
            
            {/* Conversion Triggers - Swiggy Style Alerts */}
            <ConversionTriggers
              turfId={turf.id}
              turfOwnerId={turf.user_id}
              selectedDate={selectedSlot?.date || new Date()}
              operatingStart={turf.operating_hours_start}
              operatingEnd={turf.operating_hours_end}
            />

            {/* Offer Mini Bar - Compact for Mobile */}
            <OfferMiniBar
              offers={offers}
              firstBookingOffers={firstBookingOffers}
              loyaltyMilestoneOffers={loyaltyMilestoneOffers}
              customerBookingCount={customerBookingCount}
              onScrollToOffers={() => {
                document.getElementById('offers-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Image Gallery - Mobile Optimized */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
              {turf.images && turf.images.length > 0 ? (
                <>
                  <img 
                    src={turf.images[currentImageIndex]} 
                    alt={turf.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  {turf.images.length > 1 && (
                    <>
                      <button 
                        onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : turf.images!.length - 1)}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      <button 
                        onClick={() => setCurrentImageIndex(i => i < turf.images!.length - 1 ? i + 1 : 0)}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {turf.images.map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => setCurrentImageIndex(i)}
                            className={cn("w-2 h-2 rounded-full transition-all", i === currentImageIndex ? "bg-white w-5" : "bg-white/50")}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {/* Rating Badge - Swiggy Style */}
                  {turf.avg_rating && turf.avg_rating > 0 && (
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-gray-900">{turf.avg_rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-xs">({turf.review_count})</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                  <svg className="w-20 h-20 sm:w-24 sm:h-24 text-primary/30" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Turf Info Card - Swiggy Style Compact */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {/* Header Section */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{turf.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-block bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {turf.sport_type}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">₹{turf.base_price}/hr</span>
                    </div>
                  </div>
                </div>
                
                {/* Quick Info - Stacked on Mobile */}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm text-gray-700">{turf.operating_hours_start.slice(0, 5)} - {turf.operating_hours_end.slice(0, 5)}</span>
                  </div>
                  {turf.location && (
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm text-gray-700">{turf.location}</span>
                    </div>
                  )}
                  {turf.phone_number && (
                    <a href={`tel:${turf.phone_number}`} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2 hover:bg-primary/5">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-sm text-gray-700">{turf.phone_number}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Pricing Cards - Grid Layout */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Pricing</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Base/hr</p>
                    <p className="text-lg font-bold text-primary">₹{turf.base_price}</p>
                  </div>
                  {turf.price_1h && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">1 Hour</p>
                      <p className="text-lg font-bold text-gray-700">₹{turf.price_1h}</p>
                    </div>
                  )}
                  {turf.price_2h && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">2 Hours</p>
                      <p className="text-lg font-bold text-gray-700">₹{turf.price_2h}</p>
                    </div>
                  )}
                  {turf.price_3h && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">3 Hours</p>
                      <p className="text-lg font-bold text-gray-700">₹{turf.price_3h}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities - Chip Style */}
              {turf.amenities && turf.amenities.length > 0 && (
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {turf.amenities.map((amenity) => {
                      const amenityIcons: Record<string, React.ReactNode> = {
                        'WiFi': <Wifi className="w-3.5 h-3.5" />,
                        'Parking': <Car className="w-3.5 h-3.5" />,
                        'Drinking Water': <Droplets className="w-3.5 h-3.5" />,
                        'Showers': <ShowerHead className="w-3.5 h-3.5" />,
                        'Changing Room': <Shield className="w-3.5 h-3.5" />,
                        'Cafeteria': <Coffee className="w-3.5 h-3.5" />,
                        'First Aid': <Shield className="w-3.5 h-3.5" />,
                        'Floodlights': <Sun className="w-3.5 h-3.5" />,
                        'Air Conditioning': <Wind className="w-3.5 h-3.5" />,
                        'Equipment Rental': <Dumbbell className="w-3.5 h-3.5" />,
                      };
                      return (
                        <div key={amenity} className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700">
                          {amenityIcons[amenity] || <Check className="w-3.5 h-3.5" />}
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions - Swiggy Style */}
              <div className="p-4 sm:p-6 flex flex-wrap gap-2">
                {turf.google_maps_url && (
                  <a 
                    href={turf.google_maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Directions
                  </a>
                )}
                {turf.whatsapp_number && (
                  <a 
                    href={`https://wa.me/91${turf.whatsapp_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-4 py-2 text-sm font-medium hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Loyalty Progress Bar - Shows before slot selection (only for logged in users) */}
            {user && loyaltyMilestoneOffers.length > 0 && (
              <LoyaltyProgressBar
                currentBookings={customerBookingCount}
                milestoneOffers={loyaltyMilestoneOffers}
                venueName={turf.name}
              />
            )}

            {/* First Booking Offers Preview - Shows before slot selection for everyone */}
            {firstBookingOffers.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Gift className="w-6 h-6 text-amber-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">🎁 Special Booking Offers at This Venue</h3>
                    <p className="text-sm text-gray-600">
                      {user 
                        ? 'Exclusive discounts based on your booking history' 
                        : 'Login to unlock these exclusive discounts!'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {firstBookingOffers.map(offer => {
                    // For non-logged in users, show all offers as upcoming
                    const isEligible = user ? customerBookingCount + 1 === offer.booking_number : false;
                    const isAchieved = user ? customerBookingCount >= offer.booking_number : false;
                    const label = offer.booking_number === 1 ? '1st' : offer.booking_number === 2 ? '2nd' : offer.booking_number === 3 ? '3rd' : `${offer.booking_number}th`;
                    
                    return (
                      <div 
                        key={offer.id} 
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm border-2",
                          isAchieved ? "bg-gray-100 border-gray-300 opacity-60" :
                          isEligible ? "bg-white border-emerald-400 ring-2 ring-emerald-200" :
                          "bg-white border-amber-200"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "font-bold",
                            isEligible ? "text-emerald-700" : isAchieved ? "text-gray-500" : "text-amber-700"
                          )}>
                            {label} Booking
                          </span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            isAchieved ? "bg-gray-200 text-gray-600" :
                            isEligible ? "bg-emerald-100 text-emerald-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {!user ? '🔓 Available' : isAchieved ? '✓ Used' : isEligible ? '🎯 Eligible!' : 'Upcoming'}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">
                          {offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Offer Highlight Section - Above Slots */}
            {offers.length > 0 && (
              <OfferHighlight 
                offer={offers[0] as any} 
                selectedDate={selectedSlot?.date}
                selectedTime={selectedSlot?.time}
              />
            )}

            {/* Active Offers List */}
            {offers.length > 1 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">More Offers</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {offers.slice(1).map(offer => (
                    <div key={offer.id} className="bg-white rounded-lg px-3 py-2 text-sm border border-emerald-200">
                      <span className="font-medium text-emerald-700">{offer.name}</span>
                      <span className="text-gray-500 ml-2">
                        {offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slot Calendar */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <h3 className="font-semibold text-gray-900">Select a Slot</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="h-9 w-9 border-gray-200">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[140px] text-center text-gray-700">
                    {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d')}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="h-9 w-9 border-gray-200">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3 border-b border-gray-100 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-emerald-200 border-2 border-emerald-400" />
                  <span className="text-gray-700 font-medium">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-red-300 border-2 border-red-500" />
                  <span className="text-gray-700 font-medium">Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-amber-300 border-2 border-amber-500" />
                  <span className="text-gray-700 font-medium">Held</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-emerald-600 border-2 border-emerald-700" />
                  <span className="text-gray-700 font-medium">Selected</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="grid grid-cols-8 border-b border-gray-100">
                    <div className="p-2 text-xs font-medium text-gray-500 border-r border-gray-100">Time</div>
                    {weekDays.map((day) => (
                      <div 
                        key={day.toISOString()} 
                        className={cn("p-2 text-center border-r border-gray-100 last:border-r-0", isSameDay(day, new Date()) && "bg-emerald-50")}
                      >
                        <div className="text-xs font-medium text-gray-500">{format(day, 'EEE')}</div>
                        <div className={cn("text-lg font-semibold", isSameDay(day, new Date()) ? "text-emerald-600" : "text-gray-900")}>
                          {format(day, 'd')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {timeSlots.map((time) => (
                      <div key={time} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
                        <div className="p-2 text-xs text-gray-500 border-r border-gray-100 flex items-center">{time}</div>
                        {weekDays.map((day) => {
                          const booked = isSlotBooked(day, time);
                          const blocked = isSlotBlocked(day, time);
                          const held = isSlotHeld(day, time);
                          const past = isSlotPast(day, time);
                          
                          const isPartOfSelection = selectedSlot && isSameDay(selectedSlot.date, day) && (() => {
                            const selectedStartHour = parseInt(selectedSlot.time.split(':')[0]);
                            const slotHour = parseInt(time.split(':')[0]);
                            const hours = parseInt(duration);
                            return slotHour >= selectedStartHour && slotHour < selectedStartHour + hours;
                          })();
                          
                          return (
                            <button
                              key={`${day.toISOString()}-${time}`}
                              disabled={booked || blocked || held || past}
                              onClick={() => handleSlotSelect(day, time)}
                              className={cn(
                                "p-1 border-r border-gray-100 last:border-r-0 min-h-[44px] transition-all",
                                past && "bg-gray-100 cursor-not-allowed",
                                booked && "bg-red-300 cursor-not-allowed",
                                blocked && "bg-gray-200 cursor-not-allowed",
                                held && "bg-amber-300 cursor-not-allowed",
                                !booked && !blocked && !held && !past && !isPartOfSelection && "bg-emerald-200 hover:bg-emerald-300 cursor-pointer",
                                isPartOfSelection && "bg-emerald-600 hover:bg-emerald-700"
                              )}
                            >
                              {held && <Timer className="w-3 h-3 text-amber-700 mx-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1 order-2">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm lg:sticky lg:top-20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Book This Turf
              </h3>

              {!user ? (
                <div className="text-center py-8">
                  <LogIn className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-700 font-medium mb-2">Login to Book</p>
                  <p className="text-gray-500 text-sm mb-4">Create an account or login to book slots</p>
                  <Link to="/public-auth">
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      Login / Sign Up
                    </Button>
                  </Link>
                </div>
              ) : selectedSlot ? (
                <div className="space-y-4">
                  {holdTimer > 0 && (
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border",
                      holdTimer <= 60 
                        ? "bg-red-50 border-red-200 text-red-700" 
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    )}>
                      <Timer className="w-5 h-5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Slot held for</p>
                        <p className="text-lg font-bold">{formatTimer(holdTimer)}</p>
                      </div>
                      {holdTimer <= 60 && <AlertCircle className="w-5 h-5" />}
                    </div>
                  )}

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <p className="text-sm font-medium text-emerald-700">Selected Slot</p>
                    <p className="text-lg font-bold text-gray-900">
                      {format(selectedSlot.date, 'EEE, MMM d')} at {selectedSlot.time}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Duration</Label>
                    <Select value={duration} onValueChange={handleDurationChange}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Hour</SelectItem>
                        <SelectItem value="2">2 Hours</SelectItem>
                        <SelectItem value="3">3 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Progressive Hour Upsell */}
                  {turf && parseInt(duration) < 3 && (
                    <ProgressiveHourUpsell
                      currentDuration={parseInt(duration)}
                      currentPrice={pricing.base}
                      nextDurationPrice={
                        parseInt(duration) === 1 ? turf.price_2h :
                        parseInt(duration) === 2 ? turf.price_3h : null
                      }
                      onUpgrade={() => handleDurationChange(String(parseInt(duration) + 1))}
                    />
                  )}

                  {/* First Booking Offer Banner */}
                  {getApplicableFirstBookingOffer() && (
                    <FirstBookingOfferBanner
                      offer={getApplicableFirstBookingOffer()!}
                      customerBookingCount={customerBookingCount}
                    />
                  )}

                  {/* User Info Display */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Booking as</p>
                        <p className="text-gray-900 font-medium">{profile?.name}</p>
                        <p className="text-gray-600 text-sm">{profile?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Promo Code</Label>
                    {appliedPromo ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-700">{appliedPromo.code}</span>
                          <span className="text-green-600 text-sm">
                            ({appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}%` : `₹${appliedPromo.discount_value}`} off)
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={removePromo} className="text-red-600 hover:text-red-700 h-auto p-1">
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter promo code"
                          className="bg-gray-50 border-gray-200 uppercase"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={applyPromoCode}
                          disabled={applyingPromo || !promoCode}
                          className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        >
                          {applyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                    {/* Loyalty Milestone Reward Applied */}
                    {pricing.loyaltyReward && pricing.discountSource === 'loyalty_milestone' && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-purple-700 font-bold">🏆 Loyalty Reward Unlocked!</p>
                            <p className="text-sm text-gray-900">
                              {pricing.loyaltyReward.title || `${customerBookingCount + 1}th Booking Reward`}
                            </p>
                            <p className="text-xs text-purple-600">
                              {pricing.loyaltyReward.reward_type === 'free_hour' 
                                ? 'Free Hour Applied!' 
                                : pricing.loyaltyReward.reward_type === 'percentage'
                                  ? `${pricing.loyaltyReward.reward_value}% OFF`
                                  : `₹${pricing.loyaltyReward.reward_value} OFF`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* First Booking Offer Applied */}
                    {getApplicableFirstBookingOffer() && pricing.discountSource === 'first_booking' && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Gift className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="text-xs text-amber-700 font-bold">🎉 Special Offer Applied!</p>
                            <p className="text-sm text-gray-900">
                              {getApplicableFirstBookingOffer()?.offer_title || 'First Booking Discount'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Regular Offer Applied */}
                    {applicableOffer && pricing.discountSource === 'offer' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Percent className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="text-xs text-amber-700 font-medium">Offer Applied</p>
                            <p className="text-sm text-gray-900">{applicableOffer.name}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-700">You'll earn</p>
                          <p className="text-sm font-bold text-gray-900">{calculateLoyaltyPoints(pricing.final)} loyalty points</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span className={pricing.discount > 0 ? "line-through text-gray-400" : ""}>₹{pricing.base}</span>
                      </div>
                      {pricing.discount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" />
                            Discount
                          </span>
                          <div className="text-right">
                            <span className="text-green-600 font-medium">-₹{pricing.discount}</span>
                            {pricing.savingsPercent > 0 && (
                              <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                {pricing.savingsPercent}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Attractive Savings Display */}
                    {pricing.discount > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 text-center">
                        <p className="text-green-700 text-sm">
                          🎉 You're saving <span className="font-bold text-lg">₹{pricing.discount}</span>
                          {pricing.savingsPercent >= 10 && (
                            <span className="block text-xs mt-1">That's {pricing.savingsPercent}% off the regular price!</span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                      <span className="text-gray-700">Total</span>
                      <span className="text-emerald-600">₹{pricing.final}</span>
                    </div>

                    <Button 
                      onClick={handleBooking} 
                      disabled={booking || holdTimer === 0}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg h-12"
                    >
                      {booking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Pay at the venue
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">Select a time slot from the calendar to book</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Reviews & Ratings
          </h2>
          <TurfReviews 
            turfId={turf.id}
            avgRating={turf.avg_rating || 0}
            reviewCount={turf.review_count || 0}
            onReviewAdded={fetchTurf}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 mt-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Sports Arena. All rights reserved.</p>
          <Link to="/auth" className="text-emerald-600 hover:underline">Turf Management →</Link>
        </div>
      </footer>

      {/* Booking Ticket Modal */}
      {ticketData && (
        <BookingTicket 
          booking={ticketData.booking}
          turf={ticketData.turf}
          customer={ticketData.customer}
          ticketCode={ticketData.ticketCode}
          onClose={() => setTicketData(null)}
        />
      )}
    </div>
  );
}
