import { useState, useEffect } from 'react';
import { Clock, Users, Zap, Flame, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format, startOfWeek, startOfMonth } from 'date-fns';

interface TurfEngine {
  scarcity_enabled: boolean;
  scarcity_threshold: number;
  scarcity_message: string;
  social_proof_enabled: boolean;
  social_proof_time_window: string;
  social_proof_message: string;
  urgency_enabled: boolean;
  urgency_countdown_enabled: boolean;
  fomo_enabled: boolean;
  fomo_show_live_viewers: boolean;
  fomo_show_recent_bookings: boolean;
}

interface ConversionTriggersProps {
  turfId: string;
  turfOwnerId: string;
  selectedDate?: Date;
  operatingStart: string;
  operatingEnd: string;
}

export function ConversionTriggers({ 
  turfId, 
  turfOwnerId, 
  selectedDate = new Date(),
  operatingStart,
  operatingEnd 
}: ConversionTriggersProps) {
  const [engine, setEngine] = useState<TurfEngine | null>(null);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [recentBookings, setRecentBookings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngineSettings();
    fetchAvailableSlots();
  }, [turfId, selectedDate]);

  const fetchEngineSettings = async () => {
    const { data } = await supabase
      .from('turf_engines')
      .select('*')
      .eq('turf_id', turfId)
      .maybeSingle();
    
    if (data) {
      setEngine(data as unknown as TurfEngine);
    } else {
      // Default settings if none exist
      setEngine({
        scarcity_enabled: true,
        scarcity_threshold: 3,
        scarcity_message: 'Only {count} slots left!',
        social_proof_enabled: true,
        social_proof_time_window: 'week',
        social_proof_message: '{count} people booked this week',
        urgency_enabled: true,
        urgency_countdown_enabled: true,
        fomo_enabled: true,
        fomo_show_live_viewers: false,
        fomo_show_recent_bookings: true,
      });
    }
    setLoading(false);
  };

  const fetchAvailableSlots = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Get bookings for today
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('turf_id', turfId)
      .eq('booking_date', dateStr)
      .neq('status', 'cancelled');

    // Get blocked slots
    const { data: blocked } = await supabase
      .from('blocked_slots')
      .select('start_time, end_time')
      .eq('turf_id', turfId)
      .eq('block_date', dateStr);

    // Calculate total slots and booked slots
    const startHour = parseInt(operatingStart.split(':')[0]);
    let endHour = parseInt(operatingEnd.split(':')[0]);
    if (endHour === 0) endHour = 24;
    
    const totalSlots = endHour - startHour;
    const bookedHours = new Set<number>();
    
    (bookings || []).forEach(b => {
      const start = parseInt(b.start_time.split(':')[0]);
      const end = parseInt(b.end_time.split(':')[0]);
      for (let h = start; h < end; h++) bookedHours.add(h);
    });
    
    (blocked || []).forEach(b => {
      const start = parseInt(b.start_time.split(':')[0]);
      const end = parseInt(b.end_time.split(':')[0]);
      for (let h = start; h < end; h++) bookedHours.add(h);
    });

    setAvailableSlots(Math.max(0, totalSlots - bookedHours.size));
  };

  const fetchBookingStats = async () => {
    if (!engine) return;
    
    let startDate: string;
    const now = new Date();
    
    switch (engine.social_proof_time_window) {
      case 'day':
        startDate = format(now, 'yyyy-MM-dd');
        break;
      case 'month':
        startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        break;
      default: // week
        startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    }

    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('turf_id', turfId)
      .gte('booking_date', startDate)
      .neq('status', 'cancelled');

    setRecentBookings(count || 0);
  };

  useEffect(() => {
    if (engine) fetchBookingStats();
  }, [engine]);

  if (loading || !engine) return null;

  const showScarcity = engine.scarcity_enabled && availableSlots > 0 && availableSlots <= engine.scarcity_threshold;
  const showSocialProof = engine.social_proof_enabled && recentBookings > 0;
  const showUrgency = engine.urgency_enabled && engine.urgency_countdown_enabled && availableSlots <= 5;

  const anyTriggerActive = showScarcity || showSocialProof || showUrgency;

  if (!anyTriggerActive) return null;

  return (
    <div className="space-y-2">
      {/* Scarcity Alert */}
      {showScarcity && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700 truncate">
              {engine.scarcity_message.replace('{count}', availableSlots.toString())}
            </p>
            <p className="text-xs text-red-600">Book now before it's gone!</p>
          </div>
        </div>
      )}

      {/* Social Proof - Recent Bookings */}
      {showSocialProof && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl px-3 py-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-700">
              {engine.social_proof_message.replace('{count}', recentBookings.toString())}
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>
      )}

      {/* Urgency - Time Pressure */}
      {showUrgency && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-xl px-3 py-2">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">⚡ High Demand Alert!</p>
            <p className="text-xs text-amber-600">Slots filling up fast for today</p>
          </div>
        </div>
      )}
    </div>
  );
}
