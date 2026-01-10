import { useState, useEffect } from 'react';
import { User, Phone, Calendar, Clock, MapPin, Trophy, Award, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  sport_type: string;
  turf: { name: string } | null;
}

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

interface UserDetailDialogProps {
  user: PublicUser | null;
  open: boolean;
  onClose: () => void;
}

const sportIcons: Record<string, string> = {
  'Football': '⚽',
  'Cricket': '🏏',
  'Badminton': '🏸',
  'Tennis': '🎾',
  'Basketball': '🏀',
  'Volleyball': '🏐',
};

export function UserDetailDialog({ user, open, onClose }: UserDetailDialogProps) {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchUserBookings(user.phone);
    }
  }, [user, open]);

  const fetchUserBookings = async (phone: string) => {
    setLoading(true);
    
    // Find customer records by phone
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone);
    
    const customerIds = (customers || []).map(c => c.id);
    
    if (customerIds.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }
    
    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        total_amount,
        status,
        sport_type,
        turf:turfs(name)
      `)
      .in('customer_id', customerIds)
      .order('booking_date', { ascending: false })
      .limit(20);
    
    setBookings((data || []).map((b: any) => ({
      ...b,
      turf: b.turf || null
    })));
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        
        {/* User Info Card */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </span>
                {user.email && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{user.total_bookings || 0}</p>
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold">₹{user.total_spent || 0}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{user.loyalty_points || 0}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
          </div>
        </div>
        
        {/* Bookings */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Recent Bookings
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className={cn(
                    "p-3 rounded-lg border flex items-center justify-between",
                    booking.status === 'cancelled' ? "bg-red-50 border-red-100" : "bg-card"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                      {sportIcons[booking.sport_type] || '🏟️'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{booking.turf?.name || 'Unknown Turf'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(booking.booking_date), 'MMM d, yyyy')} • {booking.start_time.slice(0, 5)}
                      </p>
                    </div>
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
                    <p className="text-sm font-medium mt-1">₹{booking.total_amount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mt-4">
          Joined: {format(parseISO(user.created_at), 'MMMM d, yyyy')}
        </div>
      </DialogContent>
    </Dialog>
  );
}
