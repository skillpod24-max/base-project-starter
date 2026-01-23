import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Trophy, Calendar, Users, Zap, Shield, Star, ChevronRight, Search, Award, Headphones, CreditCard, CheckCircle, Play, Navigation, Flame, Instagram, Twitter, Mail, Phone, Globe, Target, TrendingUp, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { cn } from '@/lib/utils';
import { differenceInHours, differenceInMinutes } from 'date-fns';
import { AnimatedSportCarousel } from '@/components/landing/AnimatedSportCarousel';
import { FeaturedOffersCarousel } from '@/components/landing/FeaturedOffersCarousel';

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
  { name: 'Rahul Sharma', text: 'Best turf booking experience! Instant confirmation and great venues. The app is super smooth.', rating: 5, sport: '⚽', location: 'Mumbai', avatar: 'RS', role: 'Football Enthusiast' },
  { name: 'Priya Menon', text: 'Love the loyalty rewards. Already saved ₹500 on my bookings! Highly recommend.', rating: 5, sport: '🏸', location: 'Delhi', avatar: 'PM', role: 'Weekend Player' },
  { name: 'Amit Kumar', text: 'Easy to book, easy to play. Perfect for our weekly corporate matches.', rating: 5, sport: '🏏', location: 'Bangalore', avatar: 'AK', role: 'Team Captain' },
];

const howItWorks = [
  { step: 1, title: 'Discover Venues', desc: 'Browse premium sports facilities near you', icon: Search },
  { step: 2, title: 'Pick Your Slot', desc: 'Select date, time & duration that works', icon: Calendar },
  { step: 3, title: 'Confirm Instantly', desc: 'Get your digital ticket immediately', icon: CheckCircle },
  { step: 4, title: 'Play & Enjoy', desc: 'Show up, scan ticket, game on!', icon: Play },
];

const features = [
  { icon: Trophy, title: 'Premium Venues', desc: 'Curated quality turfs' },
  { icon: Zap, title: 'Instant Booking', desc: 'Real-time availability' },
  { icon: Award, title: 'Earn Rewards', desc: '10 pts per ₹100 spent' },
  { icon: Shield, title: 'Slot Protection', desc: '5-min booking hold' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
  { icon: CreditCard, title: 'Pay at Venue', desc: 'No upfront payment' },
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
  const [selectedSport, setSelectedSport] = useState('');

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
    let filtered = turfsWithDistance;
    
    if (selectedSport) {
      filtered = filtered.filter(t => t.sport_type === selectedSport);
    }
    
    const turfsWithCoords = filtered.filter(t => t.distance !== null);
    if (turfsWithCoords.length >= 4) {
      return turfsWithCoords.slice(0, 4);
    }
    return filtered.slice(0, 4);
  }, [turfsWithDistance, selectedSport]);

  return (
    <div className="min-h-screen bg-background">
      {/* Enterprise Header */}
      <header className="bg-background/95 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-destructive flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground tracking-tight">Sports Arena</span>
              <p className="text-[10px] font-semibold text-primary tracking-widest hidden sm:block">ENTERPRISE BOOKING</p>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/all-turfs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Venues
            </Link>
            <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Blog
            </Link>
            <ProfileAvatar />
          </div>
        </nav>
      </header>

      {/* Hero Section - Modern Enterprise Sports Theme */}
      <section className="relative overflow-hidden bg-gradient-to-b from-foreground to-foreground/95 text-background">
        {/* Dynamic Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-destructive/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="container mx-auto px-4 py-16 sm:py-24 relative">
          <div className="max-w-6xl mx-auto">
            {/* Top Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-3 bg-background/10 border border-background/20 rounded-full px-5 py-2.5 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-success text-sm font-medium">Live</span>
                </div>
                <span className="text-background/60">•</span>
                <span className="text-background/90 text-sm font-medium">500+ Venues • 50+ Cities</span>
              </div>
            </div>

            {/* Main Heading */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
                Book Sports Venues
                <span className="block bg-gradient-to-r from-primary via-warning to-destructive bg-clip-text text-transparent py-1">
                  Like Never Before
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-background/70 max-w-2xl mx-auto leading-relaxed">
                India's most trusted platform for booking football turfs, cricket pitches, 
                badminton courts & more. <span className="text-background font-semibold">Zero advance payment.</span>
              </p>
            </div>

            {/* Sport Carousel */}
            <div className="max-w-4xl mx-auto mb-10">
              <AnimatedSportCarousel 
                selectedSport={selectedSport} 
                onSelectSport={setSelectedSport} 
              />
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-10">
              <div className="bg-background rounded-2xl p-2 shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search venues by name or location..."
                      className="pl-12 h-14 border-0 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary text-base rounded-xl text-foreground"
                    />
                  </div>
                  <Link to="/all-turfs" className="sm:w-auto">
                    <Button className="w-full sm:w-auto h-14 px-8 bg-foreground hover:bg-foreground/90 text-background rounded-xl text-base font-semibold shadow-lg">
                      <Search className="w-5 h-5 mr-2" />
                      Find Venues
                    </Button>
                  </Link>
                </div>
              </div>
              
              {userLocation && (
                <div className="flex items-center justify-center gap-2 text-background/70 mt-4">
                  <Navigation className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Showing venues near your location</span>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { value: '10K+', label: 'Happy Players', icon: Users },
                { value: '500+', label: 'Premium Venues', icon: Building2 },
                { value: '99%', label: 'Booking Success', icon: TrendingUp },
                { value: '₹0', label: 'Advance Required', icon: CreditCard },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-background/5 backdrop-blur-sm rounded-2xl p-5 border border-background/10 hover:border-background/20 transition-all group">
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl sm:text-3xl font-bold text-background">{stat.value}</div>
                  <div className="text-background/60 text-xs sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32.5C840 35 960 40 1080 42.5C1200 45 1320 45 1380 45L1440 45V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Featured Offers Carousel */}
      <FeaturedOffersCarousel />

      {/* Nearby Turfs Section */}
      {!loading && nearbyTurfs.length > 0 && (
        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Nearby Venues</h2>
                </div>
                <p className="text-muted-foreground ml-13">
                  {userLocation ? 'Premium sports arenas closest to you' : 'Featured venues in your area'}
                </p>
              </div>
              <Link to="/all-turfs">
                <Button variant="outline" className="border-border hover:border-primary text-foreground hover:text-primary rounded-xl font-medium">
                  View All
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
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Image Container */}
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {turf.images && turf.images.length > 0 ? (
                        <img 
                          src={turf.images[0]} 
                          alt={turf.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <span className="text-6xl opacity-40">{sportIcons[turf.sport_type] || '🏟️'}</span>
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                        {turf.distance !== null && (
                          <span className="bg-background text-foreground px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            {formatDistance(turf.distance)}
                          </span>
                        )}
                        
                        <span className="bg-primary text-primary-foreground px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1 ml-auto">
                          <span>{sportIcons[turf.sport_type] || '🏟️'}</span>
                          {turf.sport_type}
                        </span>
                      </div>
                      
                      {/* Offer Badge */}
                      {offer && (
                        <div className="absolute bottom-14 left-3">
                          <span className="bg-gradient-to-r from-destructive to-warning text-destructive-foreground px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5" />
                            {getUrgencyText(offer)}
                          </span>
                        </div>
                      )}
                      
                      {/* Bottom Info on Image */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-background font-bold text-base line-clamp-1 mb-0.5">{turf.name}</h3>
                        <p className="text-background/80 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="line-clamp-1">{turf.city || turf.location || 'Location'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium mb-0.5">Starting from</p>
                        <p className="text-xl font-bold text-foreground">
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
                        <Button size="sm" className="rounded-lg shadow-md font-semibold">
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

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              Why Choose Us
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Built for Sports Enthusiasts</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need for the perfect game</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((feature) => (
              <div 
                key={feature.title} 
                className="bg-card rounded-2xl p-5 text-center border border-border hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-primary/10 group-hover:bg-primary group-hover:scale-110 transition-all">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h3>
                <p className="text-muted-foreground text-xs">{feature.desc}</p>
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
            <p className="text-muted-foreground">Book your venue in 4 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative text-center group">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}
                <div className="relative z-10 w-20 h-20 bg-foreground rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                  <step.icon className="w-8 h-8 text-background" />
                </div>
                <div className="text-primary text-sm font-bold mb-2">STEP {step.step}</div>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Loved by Players</h2>
            <p className="text-muted-foreground">Join thousands of satisfied sports enthusiasts</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-xl transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-foreground to-foreground/80 rounded-xl flex items-center justify-center text-background font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.role} • {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 border border-background rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border border-background rounded-full" />
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 bg-background/10 rounded-full px-4 py-1.5 mb-6">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Available across 50+ cities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">Ready to Play?</h2>
          <p className="text-background/70 mb-10 max-w-xl mx-auto">
            Join thousands of players who book their favorite venues on Sports Arena
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/all-turfs">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 shadow-xl px-8 h-14 text-base font-semibold rounded-xl">
                Browse Venues
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10 h-14 px-8 text-base font-semibold rounded-xl">
                List Your Venue
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-4 py-12">
          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-destructive flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">Sports Arena</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                India's premier sports venue booking platform.
              </p>
              <div className="flex items-center gap-2">
                <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">For Players</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><Link to="/all-turfs" className="hover:text-foreground transition-colors">Browse Venues</Link></li>
                <li><Link to="/public-auth" className="hover:text-foreground transition-colors">Login / Sign Up</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Sports Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">For Owners</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">List Your Venue</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © 2024 Sports Arena. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Made with ❤️ in India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}