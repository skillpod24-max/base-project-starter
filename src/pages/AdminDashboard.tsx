import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Building2, Calendar, MapPin, ChevronRight, ChevronLeft, Search, ArrowLeft, Trophy, Phone, Clock, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { getAllStates, getCitiesByState } from '@/data/indianStates';
import { cn } from '@/lib/utils';
import { EnginesPanel } from '@/components/admin/EnginesPanel';
import { UserDetailDialog } from '@/components/admin/UserDetailDialog';
import { TurfAnalyticsDialog } from '@/components/admin/TurfAnalyticsDialog';

interface PublicUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
  total_bookings: number | null;
  total_spent: number | null;
  loyalty_points: number | null;
}

interface TurfManager {
  id: string;
  email: string;
  created_at: string;
  turfs_count: number;
}

interface Arena {
  id: string;
  name: string;
  sport_type: string;
  location: string | null;
  state: string | null;
  city: string | null;
  is_active: boolean;
  is_public: boolean;
  user_id: string;
  base_price: number;
  operating_hours_start: string;
  operating_hours_end: string;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  customer: { name: string; phone: string } | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'managers' | 'arenas' | 'engines'>('users');
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [selectedTurfForAnalytics, setSelectedTurfForAnalytics] = useState<Arena | null>(null);
  
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [managers, setManagers] = useState<TurfManager[]>([]);
  const [arenas, setArenas] = useState<Arena[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  
  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);
  const [arenaBookings, setArenaBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // Calendar state for bookings by day
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarWeekStart, setCalendarWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const states = getAllStates();
  const cities = selectedState !== 'all' ? getCitiesByState(selectedState) : [];

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminAccess();
    } else if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (selectedState === 'all') {
      setSelectedCity('all');
    }
  }, [selectedState]);

  const checkAdminAccess = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (data) {
      setIsAdmin(true);
    } else {
      toast({ title: 'Access Denied', description: 'You do not have admin privileges', variant: 'destructive' });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    
    if (activeTab === 'users') {
      const { data } = await supabase
        .from('public_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers((data || []) as PublicUser[]);
    } else if (activeTab === 'managers') {
      // Fetch turfs grouped by user_id
      const { data: turfsData } = await supabase
        .from('turfs')
        .select('user_id');
      
      const managerCounts: Record<string, number> = {};
      (turfsData || []).forEach((t: any) => {
        managerCounts[t.user_id] = (managerCounts[t.user_id] || 0) + 1;
      });
      
      // Get unique user_ids with their turf counts
      const uniqueManagers = Object.entries(managerCounts).map(([id, count]) => ({
        id,
        email: `Manager ${id.slice(0, 8)}`,
        created_at: new Date().toISOString(),
        turfs_count: count
      }));
      
      setManagers(uniqueManagers);
    } else if (activeTab === 'arenas') {
      const { data } = await supabase
        .from('turfs')
        .select('*')
        .order('created_at', { ascending: false });
      setArenas(data || []);
    }
    
    setLoading(false);
  };

  const fetchArenaBookings = async (arenaId: string, date?: Date) => {
    setLoadingBookings(true);
    
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        total_amount,
        status,
        customer:customers(name, phone)
      `)
      .eq('turf_id', arenaId)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: true });
    
    if (date) {
      query = query.eq('booking_date', format(date, 'yyyy-MM-dd'));
    } else {
      query = query.limit(50);
    }
    
    const { data } = await query;
    
    setArenaBookings((data || []).map((b: any) => ({
      ...b,
      customer: b.customer || null
    })));
    setLoadingBookings(false);
  };

  const handleArenaClick = (arena: Arena) => {
    setSelectedArena(arena);
    setSelectedDate(new Date());
    fetchArenaBookings(arena.id, new Date());
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    if (selectedArena) {
      fetchArenaBookings(selectedArena.id, date);
    }
  };

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(calendarWeekStart, i));
  };

  const filteredArenas = arenas.filter(arena => {
    const matchesSearch = !searchQuery || 
      arena.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      arena.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedState === 'all' || arena.state === selectedState;
    const matchesCity = selectedCity === 'all' || arena.city === selectedCity;
    return matchesSearch && matchesState && matchesCity;
  });

  const filteredUsers = users.filter(u => 
    !searchQuery || 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              activeTab === 'users' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Users className="w-5 h-5" />
            <span>Public Users</span>
          </button>
          <button
            onClick={() => setActiveTab('managers')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              activeTab === 'managers' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Building2 className="w-5 h-5" />
            <span>Turf Managers</span>
          </button>
          <button
            onClick={() => setActiveTab('arenas')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              activeTab === 'arenas' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
            )}
          >
            <MapPin className="w-5 h-5" />
            <span>Sports Arenas</span>
          </button>
          <button
            onClick={() => setActiveTab('engines')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              activeTab === 'engines' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Settings className="w-5 h-5" />
            <span>Engines</span>
          </button>
        </nav>

        <div className="p-3 border-t border-border">
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {activeTab === 'users' && 'Public Users'}
                {activeTab === 'managers' && 'Turf Managers'}
                {activeTab === 'arenas' && 'Sports Arenas'}
                {activeTab === 'engines' && 'Psychological Engines'}
              </h1>
              <p className="text-muted-foreground">
                {activeTab === 'users' && `${filteredUsers.length} registered users`}
                {activeTab === 'managers' && `${managers.length} turf managers`}
                {activeTab === 'arenas' && `${filteredArenas.length} sports arenas`}
                {activeTab === 'engines' && 'Configure behavioral optimization engines'}
              </p>
            </div>
          </div>

          {/* Filters */}
          {activeTab === 'arenas' && (
            <div className="flex flex-wrap gap-3 mb-6">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              
              <Select value={selectedCity} onValueChange={setSelectedCity} disabled={selectedState === 'all'}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search arenas..."
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="mb-6 max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* Content */}
          {activeTab === 'users' && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Phone</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Bookings</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Total Spent</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Points</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
                      <td className="px-4 py-3">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                          {u.total_bookings || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">₹{u.total_spent || 0}</td>
                      <td className="px-4 py-3">
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-sm">
                          {u.loyalty_points || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(parseISO(u.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No users found</div>
              )}
            </div>
          )}

          {activeTab === 'managers' && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Manager ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Turfs</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((m) => (
                    <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-sm">{m.id}</td>
                      <td className="px-4 py-3">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                          {m.turfs_count} turf{m.turfs_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {managers.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No managers found</div>
              )}
            </div>
          )}

          {activeTab === 'arenas' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArenas.map((arena) => (
                <div
                  key={arena.id}
                  className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                >
                  <div 
                    onClick={() => handleArenaClick(arena)}
                    className="cursor-pointer"
                  >
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{arena.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {arena.location || 'No location'}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      arena.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    )}>
                      {arena.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{arena.sport_type}</span>
                    <span className="font-medium">₹{arena.base_price}/hr</span>
                  </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {arena.state}, {arena.city}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedTurfForAnalytics(arena)}
                    >
                      View Analytics
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredArenas.length === 0 && (
                <div className="col-span-full bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
                  No arenas found matching your filters
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Arena Bookings Dialog with Calendar */}
      <Dialog open={!!selectedArena} onOpenChange={() => setSelectedArena(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedArena?.name} - Bookings
            </DialogTitle>
          </DialogHeader>

          {/* Calendar Navigation */}
          <div className="border-b border-border pb-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <button 
                onClick={() => setCalendarWeekStart(addDays(calendarWeekStart, -7))}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium">
                {format(calendarWeekStart, 'MMM d')} - {format(addDays(calendarWeekStart, 6), 'MMM d, yyyy')}
              </span>
              <button 
                onClick={() => setCalendarWeekStart(addDays(calendarWeekStart, 7))}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateChange(day)}
                  className={cn(
                    "p-2 rounded-lg text-center transition-colors",
                    isSameDay(day, selectedDate) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                  <div className="font-medium">{format(day, 'd')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Bookings for {format(selectedDate, 'MMMM d, yyyy')}
            </h4>
            
            {loadingBookings ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              </div>
            ) : arenaBookings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
                No bookings found for this date
              </div>
            ) : (
              <div className="space-y-3">
                {arenaBookings.map((booking) => (
                  <div key={booking.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                        </p>
                        {booking.customer && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {booking.customer.name} • {booking.customer.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          booking.status === 'booked' ? "bg-green-100 text-green-700" :
                          booking.status === 'cancelled' ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {booking.status}
                        </span>
                        <p className="font-medium mt-2">₹{booking.total_amount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Engines Tab Content */}
      {activeTab === 'engines' && (
        <EnginesPanel />
      )}

      {/* User Detail Dialog */}
      <UserDetailDialog 
        user={selectedUser} 
        open={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />

      {/* Turf Analytics Dialog */}
      <TurfAnalyticsDialog
        arena={selectedTurfForAnalytics}
        open={!!selectedTurfForAnalytics}
        onClose={() => setSelectedTurfForAnalytics(null)}
      />
    </div>
  );
}