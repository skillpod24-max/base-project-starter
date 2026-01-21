import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, Percent, Tag, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { differenceInHours, differenceInMinutes } from 'date-fns';

interface FeaturedOffer {
  id: string;
  name: string;
  offer_title: string | null;
  urgency_text: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  turf_id: string | null;
  max_redemptions: number | null;
  usage_count: number | null;
  turf?: {
    id: string;
    name: string;
    sport_type: string;
    city: string | null;
    images: string[] | null;
  };
}

interface FeaturedOffersCarouselProps {
  selectedState?: string;
  selectedCity?: string;
}

export function FeaturedOffersCarousel({ selectedState, selectedCity }: FeaturedOffersCarouselProps) {
  const [offers, setOffers] = useState<FeaturedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchOffers();
  }, [selectedState, selectedCity]);

  const fetchOffers = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('offers')
      .select(`
        *,
        turf:turfs!offers_turf_id_fkey(id, name, sport_type, city, images, state)
      `)
      .eq('is_active', true)
      .lte('valid_from', today)
      .gte('valid_until', today)
      .not('turf_id', 'is', null)
      .order('discount_value', { ascending: false })
      .limit(10);

    const { data } = await query;
    
    // Filter by location if specified
    let filteredOffers = (data || []).filter((o: any) => o.turf);
    
    if (selectedState && selectedState !== 'all') {
      filteredOffers = filteredOffers.filter((o: any) => o.turf?.state === selectedState);
    }
    if (selectedCity && selectedCity !== 'all') {
      filteredOffers = filteredOffers.filter((o: any) => o.turf?.city === selectedCity);
    }
    
    setOffers(filteredOffers as FeaturedOffer[]);
    setLoading(false);
  };

  const getUrgencyInfo = (offer: FeaturedOffer) => {
    if (offer.urgency_text) return { text: offer.urgency_text, isUrgent: true };
    
    const now = new Date();
    const validUntil = new Date(offer.valid_until + 'T23:59:59');
    const hoursLeft = differenceInHours(validUntil, now);
    
    if (offer.max_redemptions && offer.usage_count !== null) {
      const remaining = offer.max_redemptions - (offer.usage_count || 0);
      if (remaining <= 5) return { text: `Only ${remaining} left!`, isUrgent: true };
    }
    
    if (hoursLeft <= 6) {
      const minsLeft = differenceInMinutes(validUntil, now);
      return { text: `Ends in ${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`, isUrgent: true };
    }
    if (hoursLeft <= 24) return { text: `Ends in ${hoursLeft}h`, isUrgent: true };
    if (hoursLeft <= 48) return { text: 'Ends Tomorrow', isUrgent: false };
    
    return { text: '', isUrgent: false };
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, offers.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, offers.length - 2)) % Math.max(1, offers.length - 2));
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (offers.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-warning/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-lg shadow-destructive/25">
              <Flame className="w-6 h-6 text-destructive-foreground" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                Hot Deals
                <Sparkles className="w-6 h-6 text-warning" />
              </h2>
              <p className="text-muted-foreground text-sm">Limited time offers on premium venues</p>
            </div>
          </div>
          
          {offers.length > 3 && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden">
          <div 
            className="flex gap-5 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
          >
            {offers.map((offer) => {
              const urgency = getUrgencyInfo(offer);
              
              return (
                <Link
                  key={offer.id}
                  to={offer.turf ? `/turf/${offer.turf.id}` : '/all-turfs'}
                  className="flex-shrink-0 w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group"
                >
                  <div className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-2xl transition-all duration-300 h-full">
                    {/* Offer Image */}
                    <div className="aspect-[16/9] relative overflow-hidden">
                      {offer.turf?.images?.[0] ? (
                        <img 
                          src={offer.turf.images[0]} 
                          alt={offer.turf.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Tag className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      
                      {/* Discount Badge */}
                      <div className="absolute top-3 left-3">
                        <div className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground px-4 py-2 rounded-xl font-bold text-lg shadow-lg flex items-center gap-1">
                          {offer.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4" />
                              {offer.discount_value}% OFF
                            </>
                          ) : (
                            <>₹{offer.discount_value} OFF</>
                          )}
                        </div>
                      </div>
                      
                      {/* Urgency Badge */}
                      {urgency.text && (
                        <div className="absolute top-3 right-3">
                          <div className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg",
                            urgency.isUrgent 
                              ? "bg-warning text-warning-foreground animate-pulse" 
                              : "bg-card/90 text-foreground"
                          )}>
                            <Clock className="w-3 h-3" />
                            {urgency.text}
                          </div>
                        </div>
                      )}
                      
                      {/* Venue Info */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold text-lg line-clamp-1">
                          {offer.offer_title || offer.name}
                        </h3>
                        {offer.turf && (
                          <p className="text-white/80 text-sm mt-1">
                            {offer.turf.name} • {offer.turf.city || offer.turf.sport_type}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Offer Details */}
                    <div className="p-4">
                      {offer.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">{offer.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Dots */}
        {offers.length > 1 && (
          <div className="flex justify-center gap-2 mt-6 sm:hidden">
            {offers.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
