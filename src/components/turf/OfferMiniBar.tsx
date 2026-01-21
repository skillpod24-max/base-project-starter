import { Flame, Tag, Gift, Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Offer {
  id: string;
  name: string;
  offer_title?: string | null;
  discount_type: string;
  discount_value: number;
}

interface FirstBookingOffer {
  id: string;
  booking_number: number;
  discount_type: string;
  discount_value: number;
  offer_title?: string | null;
}

interface LoyaltyMilestoneOffer {
  id: string;
  milestone_booking_count: number;
  reward_type: string;
  reward_value: number;
  title?: string | null;
}

interface OfferMiniBarProps {
  offers: Offer[];
  firstBookingOffers: FirstBookingOffer[];
  loyaltyMilestoneOffers: LoyaltyMilestoneOffer[];
  customerBookingCount: number;
  onScrollToOffers: () => void;
}

export function OfferMiniBar({ 
  offers, 
  firstBookingOffers, 
  loyaltyMilestoneOffers, 
  customerBookingCount,
  onScrollToOffers 
}: OfferMiniBarProps) {
  const hasOffers = offers.length > 0;
  const hasFirstBooking = firstBookingOffers.length > 0;
  const hasLoyalty = loyaltyMilestoneOffers.length > 0;
  
  if (!hasOffers && !hasFirstBooking && !hasLoyalty) return null;

  // Get next loyalty milestone
  const nextMilestone = loyaltyMilestoneOffers.find(m => m.milestone_booking_count > customerBookingCount);

  return (
    <div 
      onClick={onScrollToOffers}
      className="bg-gradient-to-r from-primary/10 via-destructive/10 to-warning/10 border border-primary/20 rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Active Offers */}
          {hasOffers && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex items-center gap-1">
                {offers.slice(0, 2).map((offer, i) => (
                  <span 
                    key={offer.id}
                    className={cn(
                      "bg-destructive text-destructive-foreground px-2 py-0.5 rounded-md text-xs font-bold",
                      i > 0 && "hidden sm:inline-flex"
                    )}
                  >
                    {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`} OFF
                  </span>
                ))}
                {offers.length > 2 && (
                  <span className="text-muted-foreground text-xs hidden sm:inline">
                    +{offers.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* First Booking Offers */}
          {hasFirstBooking && customerBookingCount === 0 && (
            <div className="flex items-center gap-2 flex-shrink-0 border-l border-border/50 pl-3">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <Gift className="w-4 h-4 text-success" />
              </div>
              <span className="bg-success text-success-foreground px-2 py-0.5 rounded-md text-xs font-bold">
                1st Booking Special
              </span>
            </div>
          )}
          
          {/* Loyalty Progress */}
          {nextMilestone && (
            <div className="flex items-center gap-2 flex-shrink-0 border-l border-border/50 pl-3">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-warning" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Next reward in</span>
                <span className="text-xs font-bold text-foreground">
                  {nextMilestone.milestone_booking_count - customerBookingCount} bookings
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2">
          <span className="text-xs font-medium hidden sm:block">View All</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
