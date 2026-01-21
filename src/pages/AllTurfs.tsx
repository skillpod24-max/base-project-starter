import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, Filter, Search, X, Trophy, Star, Navigation, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { getAllStates, getCitiesByState } from '@/data/indianStates';
import { cn } from '@/lib/utils';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { AnimatedSportCarousel } from '@/components/landing/AnimatedSportCarousel';
import { FeaturedOffersCarousel } from '@/components/landing/FeaturedOffersCarousel';

interface PublicTurf {
  id: string;
  name: string;
  sport_type: string;
  location: string | null;
  images: string[] | null;
  base_price: number;
  price_1h: number | null;
  operating_hours_start: string;
  operating_hours_end: string;
  state: string | null;
  city: string | null;
  avg_rating: number | null;
  review_count: number | null;
  user_id: string;
}

interface ActiveOffer {
  id: string;
  turf_id: string | null;
  user_id: string;
  discount_type: string;
  discount_value: number;
}

const sportIcons: Record<string, string> = {
  'Football': '⚽',
  'Cricket': '🏏',
  'Badminton': '🏸',
  'Tennis': '🎾',
  'Basketball': '🏀',
  'Volleyball': '🏐',
  'Hockey': '🏑',
  'Table Tennis': '🏓',
};

export default function AllTurfs() {
  const [turfs, setTurfs] = useState<PublicTurf[]>([]);
  const [offers, setOffers] = useState<ActiveOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSport, setSelectedSport] = useState('');

  const states = getAllStates();
  const cities = selectedState !== 'all' ? getCitiesByState(selectedState) : [];

  useEffect(() => {
    fetchTurfs();
    fetchOffers();
  }, []);

  useEffect(() => {
    if (selectedState === 'all') {
      setSelectedCity('all');
    }
  }, [selectedState]);

  const fetchTurfs = async () => {
    const { data } = await supabase
      .from('turfs')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true);
    setTurfs(data || []);
    setLoading(false);
  };

  const fetchOffers = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('offers')
      .select('id, turf_id, user_id, discount_type, discount_value')
      .eq('is_active', true)
      .lte('valid_from', today)
      .gte('valid_until', today);
    setOffers(data || []);
  };

  const getTurfOffer = (turfId: string, userId: string) => {
    const turfOffer = offers.find(o => o.turf_id === turfId);
    if (turfOffer) return turfOffer;
    const ownerOffer = offers.find(o => o.turf_id === null && o.user_id === userId);
    return ownerOffer || null;
  };

  const sports = useMemo(() => {
    return [...new Set(turfs.map(t => t.sport_type))];
  }, [turfs]);

  const filteredTurfs = useMemo(() => {
    return turfs.filter(turf => {
      const matchesSearch = !searchQuery || 
        turf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        turf.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = selectedState === 'all' || turf.state === selectedState;
      const matchesCity = selectedCity === 'all' || turf.city === selectedCity;
      const matchesSport = !selectedSport || turf.sport_type === selectedSport;
      return matchesSearch && matchesState && matchesCity && matchesSport;
    });
  }, [turfs, searchQuery, selectedState, selectedCity, selectedSport]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedCity('all');
    setSelectedSport('');
  };

  const hasActiveFilters = searchQuery || selectedState !== 'all' || selectedCity !== 'all' || selectedSport;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground tracking-tight">Sports Arena</span>
              <p className="text-primary text-[10px] font-medium tracking-wide hidden sm:block">BOOK • PLAY • WIN</p>
            </div>
          </Link>
          <ProfileAvatar />
        </nav>
      </header>

      {/* Hero with Animated Sports */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 py-10 sm:py-14 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Sports Arena
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Browse all available venues and book your next game
          </p>
          
          {/* Animated Sport Carousel */}
          <div className="max-w-3xl mx-auto">
            <AnimatedSportCarousel 
              selectedSport={selectedSport} 
              onSelectSport={setSelectedSport} 
            />
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <FeaturedOffersCarousel selectedState={selectedState} selectedCity={selectedCity} />

      {/* Filters */}
      <section className="py-6 border-b border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="h-12 bg-background border-border rounded-xl">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All States</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity} disabled={selectedState === 'all'}>
                <SelectTrigger className="h-12 bg-background border-border rounded-xl">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSport || 'all'} onValueChange={(v) => setSelectedSport(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-12 bg-background border-border rounded-xl">
                  <Filter className="w-4 h-4 mr-2 text-primary" />
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sports.map(sport => (
                    <SelectItem key={sport} value={sport}>
                      {sportIcons[sport] || '🏆'} {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative col-span-2 sm:col-span-1 lg:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search turfs..."
                  className="pl-11 h-12 bg-background border-border rounded-xl"
                />
              </div>

              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="h-12 border-border rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <p className="text-muted-foreground text-sm mb-6">
            Showing {filteredTurfs.length} {filteredTurfs.length === 1 ? 'arena' : 'arenas'}
            {selectedSport && ` for ${selectedSport}`}
          </p>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : filteredTurfs.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-xl text-foreground font-medium mb-2">No arenas found</p>
              <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTurfs.map((turf) => {
                const offer = getTurfOffer(turf.id, turf.user_id);
                
                return (
                  <Link
                    key={turf.id}
                    to={`/turf/${turf.id}`}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {turf.images && turf.images.length > 0 ? (
                        <img 
                          src={turf.images[0]} 
                          alt={turf.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <span className="text-6xl opacity-50">{sportIcons[turf.sport_type] || '🏟️'}</span>
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Sport Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-primary text-primary-foreground px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1">
                          <span>{sportIcons[turf.sport_type] || '🏟️'}</span>
                          {turf.sport_type}
                        </span>
                      </div>
                      
                      {/* Offer Badge */}
                      {offer && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`} OFF
                          </span>
                        </div>
                      )}
                      
                      {/* Bottom Info */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold text-lg line-clamp-1 mb-1">{turf.name}</h3>
                        {turf.location && (
                          <p className="text-white/80 text-sm flex items-center gap-1.5 line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            {turf.city || turf.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between bg-card">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium mb-0.5">Starting from</p>
                        <p className="text-2xl font-bold text-foreground">
                          ₹{turf.price_1h || turf.base_price}
                          <span className="text-sm font-normal text-muted-foreground">/hr</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {turf.avg_rating && turf.avg_rating > 0 && (
                          <div className="flex items-center gap-1 bg-warning/10 px-2 py-0.5 rounded-md">
                            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                            <span className="font-semibold text-sm text-warning">{turf.avg_rating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="text-muted-foreground text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {turf.operating_hours_start.slice(0, 5)} - {turf.operating_hours_end.slice(0, 5)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
