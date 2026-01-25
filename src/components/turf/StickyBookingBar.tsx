import { format } from 'date-fns';
import { Calendar, Clock, Sparkles, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StickyBookingBarProps {
  selectedSlot: { date: Date; time: string } | null;
  duration: string;
  pricing: {
    base: number;
    discount: number;
    final: number;
    savingsPercent: number;
  };
  isLoggedIn: boolean;
  isBooking: boolean;
  holdTimer: number;
  onBookNow: () => void;
  onScrollToBooking: () => void;
  className?: string;
}

export function StickyBookingBar({
  selectedSlot,
  duration,
  pricing,
  isLoggedIn,
  isBooking,
  holdTimer,
  onBookNow,
  onScrollToBooking,
  className
}: StickyBookingBarProps) {
  // Only show on mobile
  if (!selectedSlot) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
      "bg-white/95 backdrop-blur-xl border-t-2 border-primary/20 shadow-2xl",
      "transform transition-all duration-300 ease-out",
      "animate-slide-in-bottom",
      className
    )}>
      {/* Timer Warning Bar */}
      {holdTimer > 0 && holdTimer <= 60 && (
        <div className="bg-destructive text-destructive-foreground text-center py-1 text-xs font-medium animate-pulse">
          ⏰ Hurry! Hold expires in {formatTimer(holdTimer)}
        </div>
      )}
      
      <div className="px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center justify-between gap-3">
          {/* Slot Info */}
          <button 
            onClick={onScrollToBooking}
            className="flex-1 flex items-center gap-3 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm truncate">
                  {format(selectedSlot.date, 'EEE, MMM d')}
                </p>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{selectedSlot.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{duration} hr{parseInt(duration) > 1 ? 's' : ''}</span>
                {holdTimer > 0 && (
                  <span className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    holdTimer <= 60 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                  )}>
                    {formatTimer(holdTimer)}
                  </span>
                )}
              </div>
            </div>
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </button>
          
          {/* Price & CTA */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              {pricing.discount > 0 && (
                <p className="text-xs text-muted-foreground line-through">₹{pricing.base}</p>
              )}
              <p className="font-bold text-lg text-foreground">₹{pricing.final}</p>
              {pricing.savingsPercent > 0 && (
                <span className="bg-success/10 text-success text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pricing.savingsPercent}% OFF
                </span>
              )}
            </div>
            
            <Button
              onClick={isLoggedIn ? onBookNow : onScrollToBooking}
              disabled={isBooking || (isLoggedIn && holdTimer === 0)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-12 rounded-xl font-bold shadow-lg"
            >
              {isBooking ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Booking...
                </span>
              ) : isLoggedIn ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Book Now
                </span>
              ) : (
                'Login to Book'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}