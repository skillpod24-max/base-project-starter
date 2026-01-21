import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const sports = [
  { icon: '⚽', name: 'Football', color: 'from-green-500 to-emerald-600' },
  { icon: '🏏', name: 'Cricket', color: 'from-blue-500 to-indigo-600' },
  { icon: '🏸', name: 'Badminton', color: 'from-yellow-500 to-orange-500' },
  { icon: '🎾', name: 'Tennis', color: 'from-lime-500 to-green-600' },
  { icon: '🏀', name: 'Basketball', color: 'from-orange-500 to-red-500' },
  { icon: '🏐', name: 'Volleyball', color: 'from-cyan-500 to-blue-600' },
  { icon: '🏑', name: 'Hockey', color: 'from-purple-500 to-pink-500' },
  { icon: '🏓', name: 'Table Tennis', color: 'from-red-500 to-rose-600' },
];

interface AnimatedSportCarouselProps {
  onSelectSport?: (sport: string) => void;
  selectedSport?: string;
}

export function AnimatedSportCarousel({ onSelectSport, selectedSport }: AnimatedSportCarouselProps) {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || isPaused) return;

    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const animate = () => {
      scrollPosition += scrollSpeed;
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused]);

  const handleSportClick = (sportName: string) => {
    if (onSelectSport) {
      onSelectSport(selectedSport === sportName ? '' : sportName);
    }
  };

  // Duplicate items for seamless infinite scroll
  const duplicatedSports = [...sports, ...sports];

  return (
    <div 
      className="relative overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-hidden scrollbar-hide"
        style={{ scrollBehavior: isPaused ? 'smooth' : 'auto' }}
      >
        {duplicatedSports.map((sport, index) => (
          <button
            key={`${sport.name}-${index}`}
            onClick={() => handleSportClick(sport.name)}
            className={cn(
              "flex-shrink-0 group relative",
              "w-24 h-24 sm:w-28 sm:h-28",
              "rounded-3xl transition-all duration-300",
              "hover:scale-110 hover:shadow-2xl",
              selectedSport === sport.name 
                ? "scale-110 ring-4 ring-primary ring-offset-2 ring-offset-background shadow-2xl" 
                : "hover:ring-2 hover:ring-primary/50"
            )}
          >
            <div className={cn(
              "absolute inset-0 rounded-3xl bg-gradient-to-br opacity-90",
              sport.color
            )} />
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-1">
              <span className="text-4xl sm:text-5xl filter drop-shadow-lg transition-transform group-hover:scale-110">
                {sport.icon}
              </span>
              <span className="text-white text-xs font-semibold tracking-wide opacity-90">
                {sport.name}
              </span>
            </div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute -inset-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-shine" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
