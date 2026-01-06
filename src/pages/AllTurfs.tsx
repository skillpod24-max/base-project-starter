import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, Filter, Search, X, Trophy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { getAllStates, getCitiesByState } from '@/data/indianStates';
import { cn } from '@/lib/utils';
import { ProfileAvatar } from '@/components/ProfileAvatar';

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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');

  const states = getAllStates();
  const cities = selectedState !== 'all' ? getCitiesByState(selectedState) : [];

  useEffect(() => {
    fetchTurfs();
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
      const matchesSport = selectedSport === 'all' || turf.sport_type === selectedSport;
      return matchesSearch && matchesState && matchesCity && matchesSport;
    });
  }, [turfs, searchQuery, selectedState, selectedCity, selectedSport]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedCity('all');
    setSelectedSport('all');
  };

  const hasActiveFilters = searchQuery || selectedState !== 'all' || selectedCity !== 'all' || selectedSport !== 'all';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Sports Arena</span>
          </Link>
          <ProfileAvatar />
        </nav>
      </header>

      {/* Hero with Sports Icons */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-green-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            {Object.entries(sportIcons).slice(0, 6).map(([sport, icon]) => (
              <div 
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl cursor-pointer transition-all",
                  selectedSport === sport 
                    ? "bg-emerald-500 shadow-lg scale-110" 
                    : "bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md"
                )}
              >
                {icon}
              </div>
            ))}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Sports Arena
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Browse all available venues and book your next game
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="h-11 bg-white border-gray-200">
                  <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
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
                <SelectTrigger className="h-11 bg-white border-gray-200">
                  <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="h-11 bg-white border-gray-200">
                  <Filter className="w-4 h-4 mr-2 text-emerald-500" />
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search turfs..."
                  className="pl-10 h-11 bg-white border-gray-200"
                />
              </div>

              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="h-11 border-gray-200 text-gray-600"
                >
                  <X className="w-4 h-4 mr-2" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <p className="text-gray-500 text-sm mb-6">
            Showing {filteredTurfs.length} {filteredTurfs.length === 1 ? 'arena' : 'arenas'}
          </p>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
            </div>
          ) : filteredTurfs.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-900 mb-2">No arenas found</p>
              <p className="text-gray-500 mb-4">Try adjusting your filters</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTurfs.map((turf) => (
                <Link
                  key={turf.id}
                  to={`/turf/${turf.id}`}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all"
                >
                  <div className="aspect-[16/10] relative overflow-hidden bg-gray-100">
                    {turf.images && turf.images.length > 0 ? (
                      <img 
                        src={turf.images[0]} 
                        alt={turf.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 text-6xl">
                        {sportIcons[turf.sport_type] || '🏆'}
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        {turf.sport_type}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {turf.name}
                    </h3>
                    {turf.location && (
                      <p className="text-gray-500 text-sm flex items-center gap-1 mb-3 line-clamp-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {turf.location}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {turf.operating_hours_start.slice(0, 5)} - {turf.operating_hours_end.slice(0, 5)}
                      </div>
                      <span className="font-bold text-emerald-600">
                        ₹{turf.price_1h || turf.base_price}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
