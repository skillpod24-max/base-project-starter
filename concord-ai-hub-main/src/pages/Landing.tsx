import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Trophy, Calendar, Users, Zap, Shield, Star, ChevronRight, Search, Award, Headphones, CreditCard, CheckCircle, Play, Navigation, Timer, Flame } from 'lucide-react';
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
  { name: 'Rahul S.', text: 'Best turf booking experience! Instant confirmation and great venues.', rating: 5, sport: '⚽', location: 'Mumbai' },
  { name: 'Priya M.', text: 'Love the loyalty rewards. Already saved ₹500 on my bookings!', rating: 5, sport: '🏸', location: 'Delhi' },
  { name: 'Amit K.', text: 'Easy to book, easy to play. Perfect for our weekly matches.', rating: 5, sport: '🏏', location: 'Bangalore' },
];

const howItWorks = [
  { step: 1, title: 'Choose Your Turf', desc: 'Browse venues by location and sport', icon: Search },
  { step: 2, title: 'Select Time Slot', desc: 'Pick your preferred date and time', icon: Calendar },
  { step: 3, title: 'Instant Confirmation', desc: 'Get your booking ticket immediately', icon: CheckCircle },
  { step: 4, title: 'Play & Enjoy', desc: 'Show up and have a great game!', icon: Play },
];

const features = [
  { icon: Trophy, title: 'Premium Turfs', desc: 'Hand-picked quality venues', color: 'bg-amber-500' },
  { icon: Calendar, title: 'Instant Booking', desc: 'Real-time slot availability', color: 'bg-emerald-500' },
  { icon: Award, title: 'Loyalty Rewards', desc: 'Earn 10 points per ₹100', color: 'bg-blue-500' },
  { icon: Shield, title: 'Slot Protection', desc: '5-min hold on selection', color: 'bg-purple-500' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help', color: 'bg-rose-500' },
  { icon: CreditCard, title: 'Pay at Venue', desc: 'No advance payment', color: 'bg-teal-500' },
  { icon: Zap, title: 'Fast & Easy', desc: 'Book in under 60 seconds', color: 'bg-yellow-500' },
  { icon: Users, title: 'Group Bookings', desc: 'Perfect for team matches', color: 'bg-indigo-500' },
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

// Haversine formula for accurate distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance properly
const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

// Generate urgency text for offers
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

  // Get offer for a specific turf - must match turf_id OR be owner's general offer for that turf
  const getTurfOffer = (turfId: string, turfUserId: string) => {
    // First check for turf-specific offer
    const turfOffer = offers.find(o => o.turf_id === turfId);
    if (turfOffer) return turfOffer;
    
    // Then check for owner's general offers (turf_id is null and belongs to same owner)
    const ownerGeneralOffer = offers.find(o => o.turf_id === null && o.user_id === turfUserId);
    return ownerGeneralOffer || null;
  };

  // Sort turfs by distance from user using actual coordinates
  const turfsWithDistance = useMemo(() => {
    if (!userLocation) return turfs.map(t => ({ ...t, distance: null }));
    
    return turfs.map(turf => {
      let distance: number | null = null;
      
      // Use actual turf coordinates if available
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
      // Only sort by distance if both have coordinates
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }, [turfs, userLocation]);

  // Get nearby turfs (top 4 with distance data, otherwise first 4)
  const nearbyTurfs = useMemo(() => {
    const turfsWithCoords = turfsWithDistance.filter(t => t.distance !== null);
    if (turfsWithCoords.length >= 4) {
      return turfsWithCoords.slice(0, 4);
    }
    return turfsWithDistance.slice(0, 4);
  }, [turfsWithDistance]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">Sports Arena</span>
              <p className="text-emerald-600 text-[10px] sm:text-xs hidden sm:block">Book • Play • Win</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProfileAvatar />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-50 py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-200 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 text-sm font-medium">Instant Booking • Real-time Availability</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Book Your Perfect
              <span className="block text-emerald-500">Sports Arena Today</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Discover premium sports venues across India. Football, Cricket, Badminton & more. Easy online booking, instant confirmation!
            </p>
            
            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xl shadow-gray-200/50">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by turf name or location..."
                      className="pl-12 h-12 border-0 bg-gray-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <Link to="/all-turfs">
                    <Button className="w-full md:w-auto h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg">
                      Search Turfs
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Location Status */}
            {userLocation && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 mb-4">
                <Navigation className="w-4 h-4" />
                <span className="text-sm">Showing turfs near your location</span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { value: '500+', label: 'Happy Players', icon: Users },
                { value: '50+', label: 'Premium Turfs', icon: Trophy },
                { value: '24/7', label: 'Booking', icon: Clock },
                { value: '10K+', label: 'Points Earned', icon: Award },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <stat.icon className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-gray-500 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Turfs Section */}
      {!loading && nearbyTurfs.length > 0 && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Nearby Sports Arenas</h2>
                </div>
                <p className="text-gray-600">
                  {userLocation ? 'Venues closest to you' : 'Featured venues in your area'}
                </p>
              </div>
              <Link to="/all-turfs">
                <Button variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                  See All Turfs
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {nearbyTurfs.map((turf) => {
                const offer = getTurfOffer(turf.id, turf.user_id);
                
                return (
                  <Link
                    key={turf.id}
                    to={`/turf/${turf.id}`}
                    className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-emerald-200 transition-all duration-300"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                      {turf.images && turf.images.length > 0 ? (
                        <img 
                          src={turf.images[0]} 
                          alt={turf.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
                          <span className="text-5xl">{sportIcons[turf.sport_type] || '🏟️'}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Sport Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                          <span>{sportIcons[turf.sport_type] || '🏟️'}</span>
                          {turf.sport_type}
                        </span>
                      </div>
                      
                      {/* Distance Badge */}
                      {turf.distance !== null && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 text-gray-700 px-2 py-1 rounded-full text-xs font-medium shadow">
                            {formatDistance(turf.distance)}
                          </span>
                        </div>
                      )}
                      
                      {/* Offer Badge - Urgency UI */}
                      {offer && (
                        <div className="absolute bottom-12 right-3">
                          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1 animate-pulse">
                            <Flame className="w-3 h-3" />
                            {getUrgencyText(offer).slice(0, 18)}
                          </span>
                        </div>
                      )}
                      
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-semibold text-lg line-clamp-1">{turf.name}</h3>
                        <p className="text-white/80 text-sm flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {turf.city || turf.location || 'Location'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-xs">From</p>
                          <p className="text-xl font-bold text-gray-900">
                            ₹{turf.price_1h || turf.base_price}
                            <span className="text-sm font-normal text-gray-500">/hr</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {turf.avg_rating && turf.avg_rating > 0 ? (
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="font-medium text-sm">{turf.avg_rating.toFixed(1)}</span>
                              <span className="text-gray-400 text-xs">({turf.review_count})</span>
                            </div>
                          ) : null}
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            Book
                          </Button>
                        </div>
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Sports Arena?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Everything you need for the perfect sports experience</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 text-center border border-gray-100 hover:shadow-lg transition-shadow">
                <div className={cn("w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center", feature.color)}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Book your turf in 4 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-emerald-200" />
                )}
                <div className="relative z-10 w-16 h-16 bg-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Players Say</h2>
            <p className="text-gray-600">Trusted by sports enthusiasts across India</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-lg">
                    {t.sport}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-gray-500 text-sm">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-500 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Play?</h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            Join thousands of players who book their favorite turfs on Sports Arena
          </p>
          <Link to="/all-turfs">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-xl">
              Browse All Turfs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">Sports Arena</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                India's premier sports venue booking platform. Find, book, and play at the best turfs near you.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-500 transition-colors">
                  <span className="text-sm">📱</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-500 transition-colors">
                  <span className="text-sm">📧</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/all-turfs" className="hover:text-white transition-colors">All Turfs</Link></li>
                <li><Link to="/profile" className="hover:text-white transition-colors">My Bookings</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/public-auth" className="hover:text-white transition-colors">Login / Sign Up</Link></li>
              </ul>
            </div>

            {/* For Managers */}
            <div>
              <h4 className="font-semibold mb-4">For Turf Owners</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/auth" className="hover:text-white transition-colors">Manager Login</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">List Your Turf</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partner With Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 Sports Arena. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                500+ Happy Players
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                50+ Turfs
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Pan India
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}