import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Turf {
  id: string;
  name: string;
  operating_hours_start: string;
  operating_hours_end: string;
  slot_duration: number;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  turf_id: string;
  status: string;
  payment_status: string;
  customers?: { name: string };
}

interface BlockedSlot {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  turf_id: string;
  reason: string;
}

interface SlotCalendarProps {
  onSlotClick: (date: Date, time: string, turfId: string) => void;
  onBookingClick: (booking: Booking) => void;
}

export function SlotCalendar({ onSlotClick, onBookingClick }: SlotCalendarProps) {
  const { user } = useAuth();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  useEffect(() => {
    if (user) fetchTurfs();
  }, [user]);

  useEffect(() => {
    if (selectedTurf) {
      fetchBookings();
      fetchBlockedSlots();
    }
  }, [selectedTurf, currentDate]);

  const fetchTurfs = async () => {
    if (!user) return;
    const { data } = await supabase.from('turfs').select('*').eq('user_id', user.id).eq('is_active', true);
    setTurfs(data || []);
    if (data && data.length > 0) {
      setSelectedTurf(data[0].id);
    }
  };

  const fetchBookings = async () => {
    if (!user || !selectedTurf) return;
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    
    // Fetch ALL bookings including cancelled to show them in manager view
    const { data, error } = await supabase
      .from('bookings')
      .select('*, customers(name)')
      .eq('user_id', user.id)
      .eq('turf_id', selectedTurf)
      .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'));
    
    console.log('Bookings fetched:', data, error);
    setBookings(data || []);
  };

  const fetchBlockedSlots = async () => {
    if (!user || !selectedTurf) return;
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    
    const { data } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('user_id', user.id)
      .eq('turf_id', selectedTurf)
      .gte('block_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('block_date', format(weekEnd, 'yyyy-MM-dd'));
    
    setBlockedSlots(data || []);
  };

  const selectedTurfData = turfs.find(t => t.id === selectedTurf);

  // Format time with AM/PM
  const formatTimeWithAmPm = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const generateTimeSlots = () => {
    if (!selectedTurfData) return [];
    const slots: string[] = [];
    const [startH] = selectedTurfData.operating_hours_start.split(':').map(Number);
    let [endH] = selectedTurfData.operating_hours_end.split(':').map(Number);
    
    // Handle midnight (00:00) as 24:00
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

  const getSlotStatus = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotHour = parseInt(time.split(':')[0]);
    
    // Check for booking - check if this hour falls within booking range
    const booking = bookings.find(b => {
      if (b.booking_date !== dateStr) return false;
      const startHour = parseInt(b.start_time.split(':')[0]);
      const endHour = parseInt(b.end_time.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
    
    if (booking) {
      // Show cancelled bookings differently
      if (booking.status === 'cancelled') {
        return { status: 'cancelled', data: booking };
      }
      return { status: booking.status === 'completed' ? 'completed' : 'booked', data: booking };
    }

    // Check for blocked slots - also check full range
    const blocked = blockedSlots.find(b => {
      if (b.block_date !== dateStr) return false;
      const startHour = parseInt(b.start_time.split(':')[0]);
      const endHour = parseInt(b.end_time.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
    if (blocked) return { status: 'blocked', data: blocked };

    const now = new Date();
    const slotDate = new Date(dateStr + 'T' + time);
    if (slotDate < now) return { status: 'past', data: null };

    return { status: 'available', data: null };
  };

  const timeSlots = generateTimeSlots();
  const weekDays = getWeekDays();

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center gap-4">
        <Select value={selectedTurf} onValueChange={setSelectedTurf}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select turf" />
          </SelectTrigger>
          <SelectContent>
            {turfs.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 flex-1 justify-between sm:justify-end">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[140px] text-center">
              {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-b flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-success/20 border border-success" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20 border border-primary" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-400" />
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted border border-muted-foreground" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-accent border border-border" />
          <span>Past</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-xs font-medium text-muted-foreground border-r">Time</div>
            {weekDays.map((day) => (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "p-2 text-center border-r last:border-r-0",
                  isSameDay(day, new Date()) && "bg-primary/5"
                )}
              >
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className={cn(
                  "text-lg font-semibold",
                  isSameDay(day, new Date()) && "text-primary"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="max-h-[500px] overflow-y-auto">
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                <div className="p-2 text-xs text-muted-foreground border-r flex items-center">
                  {formatTimeWithAmPm(time)}
                </div>
                {weekDays.map((day) => {
                  const { status, data } = getSlotStatus(day, time);
                  return (
                    <div
                      key={`${day.toISOString()}-${time}`}
                      onClick={() => {
                        if (status === 'booked' && data) {
                          onBookingClick(data as Booking);
                        } else if (status === 'available') {
                          onSlotClick(day, time, selectedTurf);
                        }
                      }}
                      className={cn(
                        "p-1 border-r last:border-r-0 min-h-[48px] cursor-pointer transition-colors",
                        status === 'available' && "bg-success/10 hover:bg-success/20",
                        status === 'booked' && "bg-primary/10 hover:bg-primary/20",
                        status === 'blocked' && "bg-muted cursor-not-allowed",
                        status === 'past' && "bg-accent cursor-default",
                        status === 'completed' && "bg-accent/50 cursor-default",
                        status === 'cancelled' && "bg-red-50 hover:bg-red-100 border-l-2 border-red-400",
                      )}
                    >
                      {status === 'booked' && data && (
                        <div className="text-xs truncate px-1">
                          <span className="font-medium">{(data as Booking).customers?.name}</span>
                          <div className={cn(
                            "text-[10px] mt-0.5",
                            (data as Booking).payment_status === 'paid' && "text-success",
                            (data as Booking).payment_status === 'pending' && "text-warning",
                            (data as Booking).payment_status === 'partial' && "text-primary"
                          )}>
                            {(data as Booking).payment_status}
                          </div>
                        </div>
                      )}
                      {status === 'cancelled' && data && (
                        <div className="text-xs truncate px-1">
                          <span className="font-medium text-red-600 line-through">{(data as Booking).customers?.name}</span>
                          <div className="text-[10px] mt-0.5 text-red-500">
                            Cancelled
                          </div>
                        </div>
                      )}
                      {status === 'blocked' && data && (
                        <div className="text-xs truncate px-1 text-muted-foreground">
                          {(data as BlockedSlot).reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
