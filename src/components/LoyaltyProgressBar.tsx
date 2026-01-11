import { Gift, Trophy, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface LoyaltyMilestoneOffer {
  id: string;
  milestone_booking_count: number;
  reward_type: string;
  reward_value: number;
  free_hour_on_duration: number | null;
  title: string | null;
  description: string | null;
}

interface LoyaltyProgressBarProps {
  currentBookings: number;
  milestoneOffers: LoyaltyMilestoneOffer[];
  venueName?: string;
  className?: string;
}

export function LoyaltyProgressBar({ 
  currentBookings, 
  milestoneOffers, 
  venueName,
  className 
}: LoyaltyProgressBarProps) {
  if (!milestoneOffers || milestoneOffers.length === 0) return null;

  // Sort milestones by booking count
  const sortedMilestones = [...milestoneOffers].sort((a, b) => 
    a.milestone_booking_count - b.milestone_booking_count
  );

  // Find the next milestone to achieve
  const nextMilestone = sortedMilestones.find(m => m.milestone_booking_count > currentBookings);
  const achievedMilestones = sortedMilestones.filter(m => m.milestone_booking_count <= currentBookings);

  if (!nextMilestone) {
    // All milestones achieved
    return (
      <div className={cn(
        "bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">🎉 VIP Status Achieved!</p>
            <p className="text-sm text-gray-600">
              You've completed {currentBookings} bookings{venueName ? ` at ${venueName}` : ''}!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const bookingsToNextMilestone = nextMilestone.milestone_booking_count - currentBookings;
  const progressPercent = (currentBookings / nextMilestone.milestone_booking_count) * 100;

  const getRewardText = (milestone: LoyaltyMilestoneOffer) => {
    if (milestone.reward_type === 'free_hour') {
      return `Free Hour${milestone.free_hour_on_duration ? ` (on ${milestone.free_hour_on_duration}hr booking)` : ''}`;
    }
    if (milestone.reward_type === 'percentage') {
      return `${milestone.reward_value}% OFF`;
    }
    return `₹${milestone.reward_value} OFF`;
  };

  return (
    <div className={cn(
      "bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4",
      className
    )}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900">Loyalty Reward</h4>
            {venueName && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {venueName}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Book <span className="font-bold text-emerald-600">{bookingsToNextMilestone} more time{bookingsToNextMilestone > 1 ? 's' : ''}</span> to unlock{' '}
            <span className="font-bold text-amber-600">{getRewardText(nextMilestone)}</span>!
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">{currentBookings} bookings</span>
          <span className="font-medium text-emerald-600 flex items-center gap-1">
            <Star className="w-3 h-3" />
            {nextMilestone.milestone_booking_count} bookings
          </span>
        </div>
        <Progress value={progressPercent} className="h-3 bg-emerald-100" />
        
        {/* Milestone markers */}
        <div className="flex items-center justify-between">
          {sortedMilestones.slice(0, 4).map((milestone, idx) => {
            const isAchieved = milestone.milestone_booking_count <= currentBookings;
            const isNext = milestone === nextMilestone;
            
            return (
              <div key={milestone.id} className="flex flex-col items-center">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  isAchieved 
                    ? "bg-emerald-500 text-white" 
                    : isNext 
                      ? "bg-amber-400 text-white animate-pulse" 
                      : "bg-gray-200 text-gray-500"
                )}>
                  {isAchieved ? '✓' : milestone.milestone_booking_count}
                </div>
                <span className={cn(
                  "text-[10px] mt-1",
                  isAchieved ? "text-emerald-600" : "text-gray-400"
                )}>
                  {getRewardText(milestone).slice(0, 10)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next reward highlight */}
      <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-gray-700">
            {nextMilestone.title || `${nextMilestone.milestone_booking_count}th Booking Reward`}
          </span>
        </div>
        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          {getRewardText(nextMilestone)}
        </span>
      </div>
    </div>
  );
}
