import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, IndianRupee, Users, Clock, ArrowRight, AlertCircle, TrendingUp, Activity, ChevronLeft, ChevronRight, Percent, CreditCard, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    todayBookings: 0, 
    todayRevenue: 0, 
    pendingPayments: 0, 
    availableSlots: 0, 
    totalCustomers: 0, 
    monthRevenue: 0, 
    occupancyRate: 0,
    totalBookings: 0,
    avgBookingValue: 0,
    repeatCustomers: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [turfName, setTurfName] = useState('');
  const [turfImages, setTurfImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchDashboardData(); }, [user]);

  useEffect(() => {
    if (turfImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % turfImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [turfImages]);

  const fetchDashboardData = async () => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

    const [settingsRes, bookingsRes, pendingRes, turfsRes, customersRes, monthBookingsRes, allBookingsRes] = await Promise.all([
      supabase.from('app_settings').select('turf_name, turf_images').eq('user_id', user.id).maybeSingle(),
      supabase.from('bookings').select('*, customers(name), turfs(name)').eq('user_id', user.id).eq('booking_date', today),
      supabase.from('bookings').select('pending_amount').eq('user_id', user.id).in('payment_status', ['pending', 'partial']),
      supabase.from('turfs').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('customers').select('id, total_bookings', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('bookings').select('paid_amount, total_amount').eq('user_id', user.id).gte('booking_date', monthStart),
      supabase.from('bookings').select('id', { count: 'exact' }).eq('user_id', user.id),
    ]);

    setTurfName(settingsRes.data?.turf_name || 'Your Turf');
    setTurfImages(settingsRes.data?.turf_images || []);

    const todayBookings = bookingsRes.data?.length || 0;
    const todayRevenue = bookingsRes.data?.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0) || 0;
    const pendingPayments = pendingRes.data?.reduce((sum, b) => sum + (Number(b.pending_amount) || 0), 0) || 0;
    const totalSlots = (turfsRes.data?.length || 0) * 17;
    const availableSlots = Math.max(0, totalSlots - todayBookings);
    const totalCustomers = customersRes.count || 0;
    const monthRevenue = monthBookingsRes.data?.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0) || 0;
    const occupancyRate = totalSlots > 0 ? Math.round((todayBookings / totalSlots) * 100) : 0;
    const totalBookings = allBookingsRes.count || 0;
    const avgBookingValue = monthBookingsRes.data && monthBookingsRes.data.length > 0 
      ? Math.round(monthBookingsRes.data.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) / monthBookingsRes.data.length)
      : 0;
    const repeatCustomers = customersRes.data?.filter(c => (c.total_bookings || 0) > 1).length || 0;

    setStats({ 
      todayBookings, todayRevenue, pendingPayments, availableSlots, 
      totalCustomers, monthRevenue, occupancyRate, totalBookings,
      avgBookingValue, repeatCustomers 
    });
    setRecentBookings(bookingsRes.data?.slice(0, 5).map((b: any) => ({ 
      id: b.id, 
      customer_name: b.customers?.name, 
      turf_name: b.turfs?.name, 
      start_time: b.start_time, 
      status: b.status, 
      total_amount: b.total_amount,
      payment_status: b.payment_status,
    })) || []);
    setLoading(false);
  };

  if (loading) return <div className="page-container flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="relative rounded-xl overflow-hidden mb-6 bg-gradient-to-r from-emerald-600 to-emerald-700">
        {turfImages.length > 0 && (
          <div className="absolute inset-0">
            <img 
              src={turfImages[currentImageIndex]} 
              alt="Turf" 
              className="w-full h-full object-cover opacity-30"
            />
          </div>
        )}
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-white">
              <p className="text-emerald-100 text-sm mb-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome to {turfName}!</h1>
              <p className="text-emerald-100">Here's your business overview for today</p>
            </div>
            {turfImages.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : turfImages.length - 1)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentImageIndex(i => i < turfImages.length - 1 ? i + 1 : 0)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-100 text-sm mb-1">
                <CalendarDays className="w-4 h-4" />
                <span>Today's Bookings</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.todayBookings}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-100 text-sm mb-1">
                <IndianRupee className="w-4 h-4" />
                <span>Today's Revenue</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{stats.todayRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-100 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>Available Slots</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.availableSlots}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-100 text-sm mb-1">
                <Activity className="w-4 h-4" />
                <span>Occupancy</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.occupancyRate}%</p>
            </div>
          </div>
        </div>
        
        {/* Image indicators */}
        {turfImages.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
            {turfImages.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentImageIndex(i)} 
                className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xl font-semibold">₹{stats.pendingPayments.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pending Payments</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xl font-semibold">₹{stats.monthRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Month Revenue</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-semibold">{stats.totalCustomers}</p>
              <p className="text-xs text-muted-foreground">Total Customers</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-semibold">{stats.totalBookings}</p>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xl font-semibold">₹{stats.avgBookingValue}</p>
              <p className="text-xs text-muted-foreground">Avg. Booking</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-semibold">{stats.repeatCustomers}</p>
              <p className="text-xs text-muted-foreground">Repeat Customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Link to="/bookings" className="p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors text-center">
          <CalendarDays className="w-6 h-6 mx-auto mb-2 text-primary" /><p className="text-sm font-medium">Add Booking</p>
        </Link>
        <Link to="/expenses" className="p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors text-center">
          <IndianRupee className="w-6 h-6 mx-auto mb-2 text-destructive" /><p className="text-sm font-medium">Add Expense</p>
        </Link>
        <Link to="/customers" className="p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors text-center">
          <Users className="w-6 h-6 mx-auto mb-2 text-success" /><p className="text-sm font-medium">Customers</p>
        </Link>
        <Link to="/reports" className="p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" /><p className="text-sm font-medium">Reports</p>
        </Link>
      </div>

      {/* Today's Bookings */}
      <div className="bg-card border rounded-lg">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-medium">Today's Bookings</h3>
          <Link to="/bookings" className="text-sm text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No bookings for today</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/bookings">Create First Booking</Link></Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Turf</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="font-medium">{b.customer_name}</td>
                    <td>{b.turf_name}</td>
                    <td>{b.start_time?.slice(0, 5)}</td>
                    <td>₹{b.total_amount}</td>
                    <td>
                      <span className={`status-badge ${b.payment_status === 'paid' ? 'status-available' : b.payment_status === 'partial' ? 'status-blocked' : 'status-booked'}`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
