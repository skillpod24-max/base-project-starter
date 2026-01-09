import { Gift, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface FirstBookingOfferBannerProps {
  offer: FirstBookingOffer;
  customerBookingCount: number;
  className?: string;
}

export function FirstBookingOfferBanner({ offer, customerBookingCount, className }: FirstBookingOfferBannerProps) {
  const getBookingLabel = (num: number) => {
    const labels: Record<number, string> = {
      1: '1st',
      2: '2nd',
      3: '3rd',
    };
    return labels[num] || `${num}th`;
  };

  const discountText = offer.discount_type === 'percentage' 
    ? `${offer.discount_value}% OFF`
    : `₹${offer.discount_value} OFF`;

  const isEligible = customerBookingCount + 1 === offer.booking_number;

  if (!isEligible) return null;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 p-4",
      className
    )}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-yellow-400/10 to-orange-400/10 animate-pulse" />
      
      <div className="relative flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-bounce">
          <Gift className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {getBookingLabel(offer.booking_number)} BOOKING OFFER
            </span>
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          
          <h4 className="text-lg font-bold text-gray-900">
            {offer.offer_title || `Get ${discountText} on your ${getBookingLabel(offer.booking_number)} booking!`}
          </h4>
          
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
            <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">
              {discountText}
            </span>
            <span className="text-gray-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {offer.start_hour}:00 - {offer.end_hour}:00
            </span>
          </div>
          
          {offer.urgency_text && (
            <p className="mt-2 text-sm font-medium text-orange-600 flex items-center gap-1 animate-pulse">
              <Zap className="w-4 h-4" />
              {offer.urgency_text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
