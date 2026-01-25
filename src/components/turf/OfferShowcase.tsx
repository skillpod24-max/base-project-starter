import { useState, useEffect } from 'react';
import { Flame, Timer, Zap, Gift, Sparkles, Trophy, Star, Percent, ChevronRight, Award, Crown } from 'lucide-react';
import { differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface Offer {
  id: string;
  name: string;
  offer_title?: string | null;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  valid_until?: string;
  applicable_days?: string[] | null;
  applicable_hours?: string[] | null;
  max_redemptions?: number | null;
  usage_count?: number | null;
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
  free_hour_on_duration?: number | null;
}

interface OfferShowcaseProps {
  offers: Offer[];
  firstBookingOffers: FirstBookingOffer[];
  loyaltyMilestoneOffers: LoyaltyMilestoneOffer[];
  customerBookingCount: number;
  isLoggedIn: boolean;
  className?: string;
}

export function OfferShowcase({
  offers,
  firstBookingOffers,
  loyaltyMilestoneOffers,
  customerBookingCount,
  isLoggedIn,
  className
}: OfferShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const hasOffers = offers.length > 0;
  const hasFirstBooking = firstBookingOffers.length > 0;
  const hasLoyalty = loyaltyMilestoneOffers.length > 0;

  if (!hasOffers && !hasFirstBooking && !hasLoyalty) return null;

  // Get next loyalty milestone
  const sortedMilestones = [...loyaltyMilestoneOffers].sort((a, b) => 
    a.milestone_booking_count - b.milestone_booking_count
  );
  const nextMilestone = sortedMilestones.find(m => m.milestone_booking_count > customerBookingCount);
  const progressPercent = nextMilestone 
    ? (customerBookingCount / nextMilestone.milestone_booking_count) * 100 
    : 100;

  const getRewardText = (milestone: LoyaltyMilestoneOffer) => {
    if (milestone.reward_type === 'free_hour') {
      return 'Free Hour';
    }
    if (milestone.reward_type === 'percentage') {
      return `${milestone.reward_value}% OFF`;
    }
    return `₹${milestone.reward_value} OFF`;
  };

  return (
    <div className={cn("space-y-4", className)} id="offers-section">
      {/* Hero Offer Card - Animated */}
      {hasOffers && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/90 via-destructive to-orange-600 p-5 text-white shadow-xl">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-ping" style={{ animationDuration: '3s' }} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xs text-white/70 font-medium uppercase tracking-wide">Limited Time</span>
                  <h3 className="font-bold text-lg">{offers[0].offer_title || offers[0].name}</h3>
                </div>
              </div>
              <div className="bg-white text-destructive px-3 py-1.5 rounded-full text-sm font-bold animate-bounce">
                {offers[0].discount_type === 'percentage' 
                  ? `${offers[0].discount_value}% OFF` 
                  : `₹${offers[0].discount_value} OFF`}
              </div>
            </div>
            
            {offers[0].description && (
              <p className="text-white/80 text-sm mb-4">{offers[0].description}</p>
            )}
            
            {/* Countdown Timer */}
            {offers[0].valid_until && (
              <CountdownTimer validUntil={offers[0].valid_until} />
            )}
            
            {/* Scarcity Indicator */}
            {offers[0].max_redemptions && offers[0].usage_count !== undefined && (
              <div className="mt-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-sm text-white/90">
                  Only {offers[0].max_redemptions - (offers[0].usage_count || 0)} left!
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* More Offers Row */}
      {offers.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {offers.slice(1).map((offer, idx) => (
            <div 
              key={offer.id}
              className="flex-shrink-0 w-36 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-3 hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-2">
                <Percent className="w-4 h-4 text-white" />
              </div>
              <p className="font-bold text-gray-900 text-sm truncate">{offer.name}</p>
              <p className="text-orange-600 font-bold">
                {offer.discount_type === 'percentage' 
                  ? `${offer.discount_value}%` 
                  : `₹${offer.discount_value}`} OFF
              </p>
            </div>
          ))}
        </div>
      )}

      {/* First Booking Offers - Journey Style */}
      {hasFirstBooking && (
        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4 overflow-hidden relative">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/50 to-transparent rounded-bl-full" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">🎁 New Customer Rewards</h3>
                <p className="text-xs text-gray-600">
                  {isLoggedIn ? 'Your exclusive journey rewards' : 'Login to unlock these deals!'}
                </p>
              </div>
            </div>
            
            {/* Booking Journey Cards */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {firstBookingOffers.map(offer => {
                const isEligible = isLoggedIn && customerBookingCount + 1 === offer.booking_number;
                const isAchieved = isLoggedIn && customerBookingCount >= offer.booking_number;
                const label = offer.booking_number === 1 ? '1st' : offer.booking_number === 2 ? '2nd' : offer.booking_number === 3 ? '3rd' : `${offer.booking_number}th`;
                
                return (
                  <div 
                    key={offer.id}
                    className={cn(
                      "flex-shrink-0 w-28 rounded-xl p-3 text-center transition-all relative overflow-hidden",
                      isAchieved 
                        ? "bg-gray-100 border-2 border-gray-300" 
                        : isEligible 
                          ? "bg-white border-2 border-emerald-400 shadow-lg scale-105 ring-4 ring-emerald-100" 
                          : "bg-white border-2 border-emerald-200"
                    )}
                  >
                    {isEligible && (
                      <div className="absolute -top-1 -right-1">
                        <span className="flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 items-center justify-center">
                            <Star className="w-3 h-3 text-white" />
                          </span>
                        </span>
                      </div>
                    )}
                    
                    <div className={cn(
                      "w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center",
                      isAchieved 
                        ? "bg-gray-200 text-gray-500" 
                        : isEligible 
                          ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" 
                          : "bg-emerald-100 text-emerald-600"
                    )}>
                      {isAchieved ? '✓' : <Award className="w-5 h-5" />}
                    </div>
                    
                    <p className={cn(
                      "text-xs font-medium",
                      isAchieved ? "text-gray-500" : isEligible ? "text-emerald-700" : "text-gray-600"
                    )}>
                      {label} Booking
                    </p>
                    <p className={cn(
                      "font-bold mt-1",
                      isAchieved ? "text-gray-400 line-through" : isEligible ? "text-emerald-600" : "text-gray-900"
                    )}>
                      {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`}
                    </p>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full mt-2 inline-block",
                      isAchieved 
                        ? "bg-gray-200 text-gray-500" 
                        : isEligible 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-amber-100 text-amber-700"
                    )}>
                      {isAchieved ? 'Used' : isEligible ? 'Active!' : 'Upcoming'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Progress - Gamified */}
      {hasLoyalty && nextMilestone && (
        <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-4 relative overflow-hidden">
          {/* Sparkle Effects */}
          <div className="absolute top-2 right-4 animate-pulse">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <div className="absolute bottom-3 left-6 animate-pulse delay-500">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">Loyalty Rewards</h3>
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {customerBookingCount} bookings
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {nextMilestone.milestone_booking_count - customerBookingCount} more to unlock next reward!
                </p>
              </div>
            </div>
            
            {/* Progress with Milestones */}
            <div className="relative mb-4">
              <Progress value={progressPercent} className="h-4 bg-purple-100" />
              
              {/* Milestone Dots */}
              <div className="absolute inset-0 flex items-center justify-between px-1">
                {sortedMilestones.slice(0, 4).map((m, i) => {
                  const isAchieved = m.milestone_booking_count <= customerBookingCount;
                  const isNext = m === nextMilestone;
                  const position = (m.milestone_booking_count / (sortedMilestones[Math.min(3, sortedMilestones.length - 1)]?.milestone_booking_count || 1)) * 100;
                  
                  return (
                    <div 
                      key={m.id}
                      className="absolute flex flex-col items-center"
                      style={{ left: `${Math.min(position, 95)}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm",
                        isAchieved 
                          ? "bg-purple-500 text-white" 
                          : isNext 
                            ? "bg-amber-400 text-white animate-pulse" 
                            : "bg-gray-200 text-gray-500"
                      )}>
                        {isAchieved ? '✓' : m.milestone_booking_count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Next Reward Preview */}
            <div className="bg-white/70 backdrop-blur rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs text-gray-500">Next Reward</p>
                  <p className="font-bold text-gray-900">{nextMilestone.title || `${nextMilestone.milestone_booking_count}th Booking`}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1.5 rounded-full text-sm font-bold">
                {getRewardText(nextMilestone)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Countdown Timer Component
function CountdownTimer({ validUntil }: { validUntil: string }) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const validUntilDate = new Date(validUntil + 'T23:59:59');
      const totalSeconds = differenceInSeconds(validUntilDate, now);
      
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
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [validUntil]);

  return (
    <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-3 py-2 w-fit">
      <Timer className="w-4 h-4" />
      <span className="font-mono font-bold text-sm">{countdown}</span>
    </div>
  );
}