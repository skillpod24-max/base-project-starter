import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Award, DollarSign, Users, Percent, Gift, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Arena {
  id: string;
  name: string;
  sport_type: string;
  location: string | null;
  base_price: number;
  user_id: string;
}

interface TurfAnalyticsDialogProps {
  arena: Arena | null;
  open: boolean;
  onClose: () => void;
}

interface Analytics {
  totalBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  cancelledCount: number;
  cancellationRate: number;
  offersUsed: number;
  discountGiven: number;
  revenueGrowth: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
}

export function TurfAnalyticsDialog({ arena, open, onClose }: TurfAnalyticsDialogProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (arena && open) {
      fetchAnalytics(arena.id);
    }
  }, [arena, open]);

  const fetchAnalytics = async (turfId: string) => {
    setLoading(true);
    
    // Fetch all bookings for this turf
    const { data: allBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        total_amount,
        status,
        discount_amount,
        offer_id,
        sport_type,
        customer:customers(name, phone)
      `)
      .eq('turf_id', turfId)
      .order('booking_date', { ascending: false });
    
    const bookingsData = allBookings || [];
    setBookings(bookingsData.slice(0, 50));
    
    // Calculate analytics
    const completedBookings = bookingsData.filter(b => b.status !== 'cancelled');
    const cancelledBookings = bookingsData.filter(b => b.status === 'cancelled');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const totalDiscount = completedBookings.reduce((sum, b) => sum + (b.discount_amount || 0), 0);
    const offersUsed = completedBookings.filter(b => b.offer_id).length;
    
    // Monthly revenue calculation
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const thisMonthRevenue = completedBookings
      .filter(b => new Date(b.booking_date) >= thisMonthStart)
      .reduce((sum, b) => sum + b.total_amount, 0);
    
    const lastMonthRevenue = completedBookings
      .filter(b => {
        const date = new Date(b.booking_date);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, b) => sum + b.total_amount, 0);
    
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    
    setAnalytics({
      totalBookings: completedBookings.length,
      totalRevenue,
      avgBookingValue: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
      cancelledCount: cancelledBookings.length,
      cancellationRate: bookingsData.length > 0 ? (cancelledBookings.length / bookingsData.length) * 100 : 0,
      offersUsed,
      discountGiven: totalDiscount,
      revenueGrowth,
      thisMonthRevenue,
      lastMonthRevenue,
    });
    
    setLoading(false);
  };

  if (!arena) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {arena.name} - Analytics
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : analytics ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4">
                <Calendar className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-2xl font-bold">{analytics.totalBookings}</p>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                <DollarSign className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4">
                <TrendingUp className="w-5 h-5 text-amber-600 mb-2" />
                <p className={cn(
                  "text-2xl font-bold",
                  analytics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {analytics.revenueGrowth >= 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Revenue Growth</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                <Users className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-2xl font-bold">₹{Math.round(analytics.avgBookingValue)}</p>
                <p className="text-sm text-muted-foreground">Avg Booking Value</p>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-lg font-semibold">{analytics.cancelledCount}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-lg font-semibold">{analytics.cancellationRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Cancellation Rate</p>
              </div>
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-lg font-semibold">{analytics.offersUsed}</p>
                <p className="text-xs text-muted-foreground">Offers Used</p>
              </div>
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-lg font-semibold text-green-600">₹{analytics.discountGiven}</p>
                <p className="text-xs text-muted-foreground">Discounts Given</p>
              </div>
            </div>

            {/* Monthly Comparison */}
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-3">Monthly Revenue</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-xl font-bold text-primary">₹{analytics.thisMonthRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Month</p>
                  <p className="text-xl font-bold">₹{analytics.lastMonthRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div>
              <h3 className="font-medium mb-3">Recent Bookings</h3>
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">{booking.customer?.name || 'Unknown'}</td>
                        <td className="p-3">{format(parseISO(booking.booking_date), 'MMM d')}</td>
                        <td className="p-3">{booking.start_time.slice(0, 5)}</td>
                        <td className="p-3 font-medium">₹{booking.total_amount}</td>
                        <td className="p-3">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            booking.status === 'booked' ? "bg-green-100 text-green-700" :
                            booking.status === 'cancelled' ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                          )}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
