import { useState, useEffect } from 'react';
import { Flame, Timer, Zap, Users, Gift, Sparkles, AlertTriangle } from 'lucide-react';
import { differenceInHours, differenceInMinutes, differenceInSeconds, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActiveOffer {
  id: string;
  name: string;
  offer_title: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  applicable_days: string[] | null;
  applicable_hours: string[] | null;
  max_redemptions: number | null;
  usage_count: number | null;
  show_hours_before: number | null;
  offer_type: string | null;
  urgency_text: string | null;
}

interface OfferHighlightProps {
  offer: ActiveOffer;
  selectedDate?: Date;
  selectedTime?: string;
  className?: string;
}

export function OfferHighlight({ offer, selectedDate, selectedTime, className }: OfferHighlightProps) {
  const [countdown, setCountdown] = useState('');
  const [isApplicable, setIsApplicable] = useState(true);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const validUntil = new Date(offer.valid_until + 'T23:59:59');
      
      const totalSeconds = differenceInSeconds(validUntil, now);
      if (totalSeconds <= 0) {
        setCountdown('Expired');
        return;
      }
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setCountdown(`${days}d ${hours % 24}h left`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m left`);
      } else {
        setCountdown(`${minutes}m ${seconds}s left`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [offer.valid_until]);

  // Check if offer is applicable for selected slot
  useEffect(() => {
    if (!selectedDate || !selectedTime) {
      setIsApplicable(true);
      return;
    }

    const dayOfWeek = format(selectedDate, 'EEEE');
    const hour = selectedTime.split(':')[0];

    const dayMatch = !offer.applicable_days || offer.applicable_days.length === 0 || offer.applicable_days.includes(dayOfWeek);
    const hourMatch = !offer.applicable_hours || offer.applicable_hours.length === 0 || offer.applicable_hours.includes(hour);

    setIsApplicable(dayMatch && hourMatch);
  }, [offer, selectedDate, selectedTime]);

  const getDiscountText = () => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}% OFF`;
    }
    return `₹${offer.discount_value} OFF`;
  };

  const getRemainingText = () => {
    if (offer.max_redemptions && offer.usage_count !== null) {
      const remaining = offer.max_redemptions - (offer.usage_count || 0);
      if (remaining <= 5) {
        return `Only ${remaining} left!`;
      }
    }
    return null;
  };

  const getOfferIcon = () => {
    switch (offer.offer_type) {
      case 'bundle':
        return <Gift className="w-5 h-5" />;
      case 'free_addon':
        return <Sparkles className="w-5 h-5" />;
      case 'limited_access':
        return <Users className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  if (!isApplicable) return null;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4",
      className
    )}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-amber-100/50 animate-pulse" />
      
      <div className="relative">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white">
              {getOfferIcon()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                {offer.offer_title || offer.name}
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              </h3>
              <p className="text-sm text-orange-600 font-medium">{getDiscountText()}</p>
            </div>
          </div>
          
          {/* Countdown timer */}
          <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 animate-pulse">
            <Timer className="w-4 h-4" />
            {countdown}
          </div>
        </div>

        {/* Description */}
        {offer.description && (
          <p className="text-gray-600 text-sm mb-3">{offer.description}</p>
        )}

        {/* Urgency indicators */}
        <div className="flex flex-wrap gap-2">
          {getRemainingText() && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {getRemainingText()}
            </span>
          )}
          
          {offer.applicable_days && offer.applicable_days.length > 0 && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
              {offer.applicable_days.join(', ')}
            </span>
          )}
          
          {offer.applicable_hours && offer.applicable_hours.length > 0 && (
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
              {offer.applicable_hours.map(h => `${h}:00`).join(', ')}
            </span>
          )}
        </div>

        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl opacity-20 blur-lg" />
      </div>
    </div>
  );
}