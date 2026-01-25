import { useState, useEffect } from 'react';
import { Flame, Timer, Users, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface SlotDemandTimerProps {
  availableSlots: number;
  totalSlots: number;
  recentBookings: number;
  showTimer: boolean;
  className?: string;
}

export function SlotDemandTimer({
  availableSlots,
  totalSlots,
  recentBookings,
  showTimer,
  className
}: SlotDemandTimerProps) {
  const [countdown, setCountdown] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  
  // Calculate demand level
  const bookedPercent = ((totalSlots - availableSlots) / totalSlots) * 100;
  const isDemandHigh = bookedPercent >= 60;
  const isDemandCritical = bookedPercent >= 85;
  
  // Estimated time until slots fill (based on recent booking velocity)
  useEffect(() => {
    if (!showTimer || availableSlots === 0) return;
    
    // Simulate estimated fill time based on demand
    const velocity = recentBookings || 1;
    const estimatedMinutes = Math.max(5, Math.floor((availableSlots / velocity) * 30));
    setCountdown(estimatedMinutes * 60);
    
    // Update pulse intensity
    if (isDemandCritical) {
      setPulseIntensity(3);
    } else if (isDemandHigh) {
      setPulseIntensity(2);
    } else {
      setPulseIntensity(1);
    }
    
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [showTimer, availableSlots, recentBookings, isDemandHigh, isDemandCritical]);

  if (!showTimer || availableSlots >= totalSlots * 0.6) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className={cn(
      "rounded-2xl p-4 relative overflow-hidden",
      isDemandCritical 
        ? "bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 text-white" 
        : isDemandHigh 
          ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white" 
          : "bg-gradient-to-br from-blue-500 to-purple-500 text-white",
      className
    )}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(pulseIntensity)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isDemandCritical ? "bg-white/30" : "bg-white/20"
            )}>
              <Flame className={cn("w-4 h-4", isDemandCritical && "animate-bounce")} />
            </div>
            <div>
              <p className="text-xs text-white/80 uppercase tracking-wider font-medium">
                {isDemandCritical ? '🔥 Critical Demand' : isDemandHigh ? '⚡ High Demand' : '📈 Trending'}
              </p>
              <p className="font-bold text-sm">Slots Filling Fast!</p>
            </div>
          </div>
          
          {countdown > 0 && (
            <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span className="font-mono font-bold text-sm">{formatTime(countdown)}</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>{Math.round(bookedPercent)}% booked</span>
            <span>{availableSlots} slots left today</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isDemandCritical 
                  ? "bg-gradient-to-r from-yellow-300 to-white animate-pulse" 
                  : "bg-gradient-to-r from-white/60 to-white"
              )}
              style={{ width: `${bookedPercent}%` }}
            />
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-white/80" />
              <span className="text-sm">{recentBookings} booked recently</span>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
            isDemandCritical 
              ? "bg-white text-red-600 animate-pulse" 
              : "bg-white/20 text-white"
          )}>
            <TrendingUp className="w-3 h-3" />
            {isDemandCritical ? 'Book Now!' : 'Trending'}
          </div>
        </div>
      </div>
    </div>
  );
}