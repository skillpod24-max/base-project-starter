import { Clock, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProgressiveHourUpsellProps {
  currentDuration: number;
  currentPrice: number;
  nextDurationPrice: number | null;
  onUpgrade: () => void;
  className?: string;
}

export function ProgressiveHourUpsell({ 
  currentDuration, 
  currentPrice, 
  nextDurationPrice,
  onUpgrade,
  className 
}: ProgressiveHourUpsellProps) {
  if (!nextDurationPrice || currentDuration >= 3) return null;
  
  const nextDuration = currentDuration + 1;
  const savings = (currentPrice + (currentPrice / currentDuration)) - nextDurationPrice;
  const savingsPercent = Math.round((savings / nextDurationPrice) * 100);
  
  // Only show if there's actual savings
  if (savings <= 0) return null;

  return (
    <div className={cn(
      "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4",
      className
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-900">
                Add 1 more hour & save!
              </span>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Upgrade to {nextDuration} hours for just ₹{nextDurationPrice}
            </p>
            <p className="text-xs text-green-600 font-medium mt-0.5">
              Save ₹{Math.round(savings)} ({savingsPercent}% off per hour)
            </p>
          </div>
        </div>
        
        <Button 
          size="sm" 
          onClick={onUpgrade}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
        >
          <Clock className="w-4 h-4" />
          +1 Hour
        </Button>
      </div>
    </div>
  );
}
