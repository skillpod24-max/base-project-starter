import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Trophy, Calendar, Users, Zap, Shield, Star, ChevronRight, Search, Award, Headphones, CreditCard, CheckCircle, Play, Navigation, Flame, Instagram, Twitter, Mail, Phone, MapPinned, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { cn } from '@/lib/utils';
import { differenceInHours, differenceInMinutes } from 'date-fns';

interface PublicTurf {
  id: string;
  user_id: string;
  name: string;
  sport_type: string;
  location: string | null;
  description: string | null;
  images: string[] | null;
  base_price: number;
  price_1h: number | null;
  price_2h: number | null;
  operating_hours_start: string;
  operating_hours_end: string;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  avg_rating: number | null;
  review_count: number | null;
}

interface ActiveOffer {
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
  user_id: string;
  max_redemptions: number | null;
  usage_count: number | null;
  created_at: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

const testimonials = [
  { name: 'Rahul Sharma', text: 'Best turf booking experience! Instant confirmation and great venues. The app is super smooth.', rating: 5, sport: '⚽', location: 'Mumbai', avatar: 'RS' },
  { name: 'Priya Menon', text: 'Love the loyalty rewards. Already saved ₹500 on my bookings! Highly recommend.', rating: 5, sport: '🏸', location: 'Delhi', avatar: 'PM' },
  { name: 'Amit Kumar', text: 'Easy to book, easy to play. Perfect for our weekly corporate matches.', rating: 5, sport: '🏏', location: 'Bangalore', avatar: 'AK' },
];

const howItWorks = [
  { step: 1, title: 'Choose Your Turf', desc: 'Browse venues by location and sport', icon: Search },
  { step: 2, title: 'Select Time Slot', desc: 'Pick your preferred date and time', icon: Calendar },
  { step: 3, title: 'Instant Confirmation', desc: 'Get your booking ticket immediately', icon: CheckCircle },
  { step: 4, title: 'Play & Enjoy', desc: 'Show up and have a great game!', icon: Play },
];

const features = [
  { icon: Trophy, title: 'Premium Turfs', desc: 'Hand-picked quality venues' },
  { icon: Calendar, title: 'Instant Booking', desc: 'Real-time slot availability' },
  { icon: Award, title: 'Loyalty Rewards', desc: 'Earn 10 points per ₹100' },
  { icon: Shield, title: 'Slot Protection', desc: '5-min hold on selection' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
  { icon: CreditCard, title: 'Pay at Venue', desc: 'No advance payment' },
  { icon: Zap, title: 'Fast & Easy', desc: 'Book in under 60 seconds' },
  { icon: Users, title: 'Group Bookings', desc: 'Perfect for team matches' },
];

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

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

const getUrgencyText = (offer: ActiveOffer): string => {
  if (offer.urgency_text) return offer.urgency_text;
  
  const now = new Date();
  const validUntil = new Date(offer.valid_until + 'T23:59:59');
  const hoursLeft = differenceInHours(validUntil, now);
  
  if (offer.max_redemptions && offer.usage_count !== null) {
    const remaining = offer.max_redemptions - (offer.usage_count || 0);
    if (remaining <= 3) return `Only ${remaining} left!`;
  }
  
  if (hoursLeft <= 2) {
    const minsLeft = differenceInMinutes(validUntil, now);
    return `Ends in ${minsLeft}m`;
  }
  if (hoursLeft <= 24) return `Ends in ${hoursLeft}h`;
  if (hoursLeft <= 48) return 'Ends Today';
  
  if (offer.discount_type === 'percentage') {
    return `${offer.discount_value}% OFF`;
  }
  return `₹${offer.discount_value} OFF`;
};

export default function Landing() {
  const [turfs, setTurfs] = useState<PublicTurf[]>([]);
  const [offers, setOffers] = useState<ActiveOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    fetchPublicTurfs();
    fetchActiveOffers();
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) return;

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchPublicTurfs = async () => {
    const { data } = await supabase
      .from('turfs')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true);
    setTurfs((data as PublicTurf[]) || []);
    setLoading(false);
  };

  const fetchActiveOffers = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', today)
      .gte('valid_until', today)
      .order('created_at', { ascending: false });
    setOffers((data as ActiveOffer[]) || []);
  };

  const getTurfOffer = (turfId: string, turfUserId: string) => {
    const turfOffer = offers.find(o => o.turf_id === turfId);
    if (turfOffer) return turfOffer;
    
    const ownerGeneralOffer = offers.find(o => o.turf_id === null && o.user_id === turfUserId);
    return ownerGeneralOffer || null;
  };

  const turfsWithDistance = useMemo(() => {
    if (!userLocation) return turfs.map(t => ({ ...t, distance: null }));
    
    return turfs.map(turf => {
      let distance: number | null = null;
      
      if (turf.latitude && turf.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          turf.latitude,
          turf.longitude
        );
      }
      
      return { ...turf, distance };
    }).sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }, [turfs, userLocation]);

  const nearbyTurfs = useMemo(() => {
    const turfsWithCoords = turfsWithDistance.filter(t => t.distance !== null);
    if (turfsWithCoords.length >= 4) {
      return turfsWithCoords.slice(0, 4);
    }
    return turfsWithDistance.slice(0, 4);
  }, [turfsWithDistance]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground tracking-tight">Sports Arena</span>
              <p className="text-primary text-[10px] font-medium tracking-wide hidden sm:block">BOOK • PLAY • WIN</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/all-turfs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              All Venues
            </Link>
            <ProfileAvatar />
          </div>
        </nav>
      </header>

      {/* Hero Section - Redesigned */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="container mx-auto px-4 py-16 sm:py-24 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2.5 mb-8">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <span className="text-primary text-sm font-semibold tracking-wide">Live Availability • Instant Booking</span>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight">
                Find & Book
                <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  Sports Venues
                </span>
                <span className="text-muted-foreground text-3xl sm:text-4xl md:text-5xl font-bold">Near You</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Premium football turfs, cricket pitches, badminton courts & more. 
                <span className="text-foreground font-medium"> Zero advance payment. Instant confirmation.</span>
              </p>
            </div>

            {/* Search Bar - Redesigned */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-card border border-border rounded-2xl p-2 shadow-2xl shadow-primary/5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by venue name or location..."
                      className="pl-12 h-14 border-0 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary text-base rounded-xl"
                    />
                  </div>
                  <Link to="/all-turfs" className="sm:w-auto">
                    <Button className="w-full sm:w-auto h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl text-base font-semibold">
                      <Search className="w-5 h-5 mr-2" />
                      Find Venues
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Location indicator */}
              {userLocation && (
                <div className="flex items-center justify-center gap-2 text-primary mt-4">
                  <Navigation className="w-4 h-4" />
                  <span className="text-sm font-medium">Showing venues near your location</span>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
              {[
                { value: '500+', label: 'Happy Players', icon: Users },
                { value: '50+', label: 'Verified Venues', icon: Trophy },
                { value: '24/7', label: 'Booking Available', icon: Clock },
                { value: '₹0', label: 'Advance Payment', icon: CreditCard },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-card/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-border hover:border-primary/30 hover:shadow-lg transition-all group">
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-muted-foreground text-xs sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Turfs Section - Redesigned Cards */}
      {!loading && nearbyTurfs.length > 0 && (
        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Nearby Venues</h2>
                </div>
                <p className="text-muted-foreground ml-13">
                  {userLocation ? 'Sports arenas closest to you' : 'Featured venues in your area'}
                </p>
              </div>
              <Link to="/all-turfs">
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl">
                  View All Venues
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {nearbyTurfs.map((turf) => {
                const offer = getTurfOffer(turf.id, turf.user_id);
                
                return (
                  <Link
                    key={turf.id}
                    to={`/turf/${turf.id}`}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
                  >
                    {/* Image Container */}
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
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                        {/* Distance */}
                        {turf.distance !== null && (
                          <span className="bg-background/95 backdrop-blur-sm text-foreground px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            {formatDistance(turf.distance)}
                          </span>
                        )}
                        
                        {/* Sport Badge */}
                        <span className="bg-primary text-primary-foreground px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1 ml-auto">
                          <span>{sportIcons[turf.sport_type] || '🏟️'}</span>
                          {turf.sport_type}
                        </span>
                      </div>
                      
                      {/* Offer Badge */}
                      {offer && (
                        <div className="absolute bottom-16 left-3">
                          <span className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5" />
                            {getUrgencyText(offer)}
                          </span>
                        </div>
                      )}
                      
                      {/* Bottom Info on Image */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold text-lg line-clamp-1 mb-1">{turf.name}</h3>
                        <p className="text-white/80 text-sm flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">{turf.city || turf.location || 'Location'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
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
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md shadow-primary/20 font-semibold">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Why Sports Arena?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Everything you need for the perfect sports experience</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, i) => (
              <div 
                key={feature.title} 
                className="bg-card rounded-2xl p-6 text-center border border-border hover:border-primary/30 hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/10 group-hover:bg-primary group-hover:scale-110 transition-all">
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Book your venue in 4 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative text-center group">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/40 to-transparent" />
                )}
                <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform">
                  <step.icon className="w-9 h-9 text-primary-foreground" />
                </div>
                <div className="text-primary text-sm font-bold mb-2">STEP {step.step}</div>
                <h3 className="font-bold text-foreground mb-2 text-lg">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">What Players Say</h2>
            <p className="text-muted-foreground text-lg">Trusted by sports enthusiasts across India</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-xl transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                      <span>{t.sport}</span>
                      <span>•</span>
                      <span>{t.location}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-white rounded-full" />
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">Ready to Play?</h2>
          <p className="text-primary-foreground/80 mb-10 max-w-xl mx-auto text-lg">
            Join thousands of players who book their favorite venues on Sports Arena
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/all-turfs">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl px-8 h-14 text-base font-semibold rounded-xl">
                Browse All Venues
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 h-14 px-8 text-base font-semibold rounded-xl">
                List Your Venue
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Redesigned */}
      <footer className="bg-foreground text-background">
        {/* Main Footer */}
        <div className="container mx-auto px-4 py-16">
          {/* SEO Content */}
          <div className="mb-12 pb-10 border-b border-background/10">
            <h3 className="text-xl font-bold mb-4 text-primary">Book Sports Turfs Online - India's #1 Platform</h3>
            <p className="text-background/70 leading-relaxed mb-6 max-w-4xl">
              Sports Arena is India's leading online turf booking platform. Whether you're looking to book a football turf, cricket pitch, badminton court, or tennis court, we make it simple to find and reserve sports venues near you. Our platform connects players with premium sports facilities across Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, and 50+ cities.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <h4 className="text-background font-semibold mb-3">Popular Searches</h4>
                <ul className="space-y-2 text-background/60">
                  <li className="hover:text-primary transition-colors cursor-pointer">Football Turf Near Me</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Cricket Pitch Booking</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Badminton Court Online</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Tennis Court Rental</li>
                </ul>
              </div>
              <div>
                <h4 className="text-background font-semibold mb-3">Top Cities</h4>
                <ul className="space-y-2 text-background/60">
                  <li className="hover:text-primary transition-colors cursor-pointer">Mumbai Sports Arenas</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Delhi Turf Booking</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Bangalore Turfs</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Chennai Sports Venues</li>
                </ul>
              </div>
              <div>
                <h4 className="text-background font-semibold mb-3">Sports Types</h4>
                <ul className="space-y-2 text-background/60">
                  <li className="hover:text-primary transition-colors cursor-pointer">5-a-side Football</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Box Cricket</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Indoor Badminton</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Basketball Courts</li>
                </ul>
              </div>
              <div>
                <h4 className="text-background font-semibold mb-3">Features</h4>
                <ul className="space-y-2 text-background/60">
                  <li className="hover:text-primary transition-colors cursor-pointer">Instant Slot Booking</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Loyalty Rewards Program</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Pay at Venue Option</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">24/7 Customer Support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-background">Sports Arena</span>
              </div>
              <p className="text-background/60 text-sm mb-5 leading-relaxed">
                India's premier sports venue booking platform. Find, book, and play at the best turfs near you.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" aria-label="WhatsApp" className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
                <a href="#" aria-label="Email" className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* For Players */}
            <div>
              <h4 className="font-semibold mb-4 text-primary">For Players</h4>
              <ul className="space-y-3 text-background/60 text-sm">
                <li><Link to="/all-turfs" className="hover:text-background transition-colors">Browse All Venues</Link></li>
                <li><Link to="/profile" className="hover:text-background transition-colors">My Bookings</Link></li>
                <li><Link to="/public-auth" className="hover:text-background transition-colors">Login / Sign Up</Link></li>
                <li><Link to="/blog" className="hover:text-background transition-colors">Sports Blog</Link></li>
                <li><a href="#" className="hover:text-background transition-colors">Loyalty Rewards</a></li>
              </ul>
            </div>

            {/* For Turf Owners */}
            <div>
              <h4 className="font-semibold mb-4 text-primary">For Venue Owners</h4>
              <ul className="space-y-3 text-background/60 text-sm">
                <li><Link to="/auth" className="hover:text-background transition-colors">Manager Dashboard</Link></li>
                <li><a href="#" className="hover:text-background transition-colors">List Your Venue</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Pricing Plans</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Analytics & Reports</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Partner Benefits</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-primary">Company</h4>
              <ul className="space-y-3 text-background/60 text-sm">
                <li><a href="#" className="hover:text-background transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Press & Media</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4 text-primary">Support</h4>
              <ul className="space-y-3 text-background/60 text-sm">
                <li><a href="#" className="hover:text-background transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-background transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-8 border-t border-b border-background/10 mb-8">
            <div className="flex items-center gap-2 text-background/70">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Secure Booking</span>
            </div>
            <div className="flex items-center gap-2 text-background/70">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">4.8★ Rating</span>
            </div>
            <div className="flex items-center gap-2 text-background/70">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">10,000+ Bookings</span>
            </div>
            <div className="flex items-center gap-2 text-background/70">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-2 text-background/70">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">50+ Cities</span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-background/50 text-sm">
              © 2025 Sports Arena. All rights reserved. Made with ❤️ in India
            </p>
            <div className="flex items-center gap-6 text-background/60 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                500+ Happy Players
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                50+ Premium Venues
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
