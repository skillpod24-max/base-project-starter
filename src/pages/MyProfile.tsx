import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, Clock, MapPin, Trophy, AlertCircle, CheckCircle, ArrowLeft, LogOut, Star, Lock, Award, TrendingUp, Heart, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { usePublicAuth } from '@/hooks/usePublicAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  sport_type: string;
  cancellation_reason: string | null;
  turf: {
    name: string;
    location: string | null;
    sport_type: string;
  };
}

const cancellationReasons = [
  'Change of plans',
  'Found a better option',
  'Weather conditions',
  'Personal emergency',
  'Group cancelled',
  'Health issues',
  'Other'
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

export default function MyProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading, signOut, refreshProfile } = usePublicAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  
  // Password change
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/public-auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user || !profile?.phone) {
      setLoadingBookings(false);
      return;
    }
    
    // First find all customer records matching this user's phone
    const { data: customerRecords } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', profile.phone);
    
    const customerIds = (customerRecords || []).map(c => c.id);
    
    if (customerIds.length === 0) {
      setBookings([]);
      setLoadingBookings(false);
      return;
    }
    
    // Query bookings for all matching customer IDs
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
        cancellation_reason,
        turf:turfs(name, location, sport_type)
      `)
      .in('customer_id', customerIds)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });

    setBookings((data || []).map((b: any) => ({
      ...b,
      turf: b.turf || { name: 'Unknown', location: null, sport_type: b.sport_type || 'Unknown' }
    })));
    setLoadingBookings(false);
  };

  // Stats calculations
  const stats = useMemo(() => {
    const completedBookings = bookings.filter(b => 
      b.status !== 'cancelled' && new Date(`${b.booking_date}T${b.end_time}`) <= new Date()
    );
    
    const totalBookings = completedBookings.length;
    const totalSpent = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const loyaltyPoints = Math.floor(totalSpent / 100) * 10;
    
    // Booking score (based on bookings and no-shows)
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const score = Math.max(0, Math.min(100, 100 - (cancelledCount * 10) + (totalBookings * 2)));
    
    // Favorite sport
    const sportCounts: Record<string, number> = {};
    completedBookings.forEach(b => {
      const sport = b.sport_type || b.turf.sport_type;
      sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });
    const favoriteSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    return { totalBookings, totalSpent, loyaltyPoints, score, favoriteSport };
  }, [bookings]);

  const canCancelBooking = (booking: Booking) => {
    if (booking.status === 'cancelled') return false;
    
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    const hoursUntilBooking = differenceInHours(bookingDateTime, now);
    
    // Changed from 5 hours to 6 hours as per requirement
    return hoursUntilBooking >= 6;
  };

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setCustomReason('');
    setCancelDialogOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason) return;
    
    setCancelling(true);
    const reason = cancelReason === 'Other' ? customReason : cancelReason;

    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        cancelled_by: user?.id
      })
      .eq('id', selectedBooking.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to cancel booking', variant: 'destructive' });
    } else {
      toast({ title: 'Booking Cancelled', description: 'Your booking has been cancelled successfully' });
      fetchBookings();
    }

    setCancelling(false);
    setCancelDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setChangingPassword(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Password updated successfully' });
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setChangingPassword(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const upcomingBookings = bookings.filter(b => {
    if (b.status === 'cancelled') return false;
    const bookingDate = new Date(`${b.booking_date}T${b.end_time}`);
    return bookingDate > new Date();
  });

  const pastBookings = bookings.filter(b => {
    if (b.status === 'cancelled') return true;
    const bookingDate = new Date(`${b.booking_date}T${b.end_time}`);
    return bookingDate <= new Date();
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <Button variant="ghost" onClick={handleSignOut} className="text-gray-600 hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile?.name || 'User'}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-500 mt-2">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {profile?.phone || 'No phone'}
                </span>
                {profile?.email && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {profile.email}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)} className="gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Award className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.loyaltyPoints}</p>
            <p className="text-gray-500 text-sm">Loyalty Points</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.score}</p>
            <p className="text-gray-500 text-sm">Booking Score</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            <p className="text-gray-500 text-sm">Total Bookings</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Heart className="w-6 h-6 text-rose-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900 flex items-center justify-center gap-1">
              {stats.favoriteSport ? (
                <>
                  {sportIcons[stats.favoriteSport] || '🏟️'}
                </>
              ) : '-'}
            </p>
            <p className="text-gray-500 text-sm">Favorite Sport</p>
          </div>
        </div>

        {/* Bookings Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              History ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {loadingBookings ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming bookings</p>
                <Link to="/" className="mt-4 inline-block text-emerald-600 hover:underline">
                  Book a turf →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl">
                          {sportIcons[booking.sport_type || booking.turf.sport_type] || '🏟️'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{booking.turf.name}</h3>
                          <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {booking.turf.location || 'No location'}
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                        {booking.turf.sport_type}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(booking.booking_date), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="font-semibold text-gray-900 text-lg">₹{booking.total_amount}</span>
                      {canCancelBooking(booking) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(booking)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancel Booking
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Cannot cancel within 6 hours
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {pastBookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <p className="text-gray-500">No past bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className={cn(
                      "bg-white rounded-xl border p-4",
                      booking.status === 'cancelled' ? 'border-red-100 bg-red-50/50' : 'border-gray-100'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                          {sportIcons[booking.sport_type || booking.turf.sport_type] || '🏟️'}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{booking.turf.name}</h3>
                          <p className="text-gray-500 text-sm mt-1">
                            {format(parseISO(booking.booking_date), 'MMM d, yyyy')} • {booking.start_time.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {booking.status === 'cancelled' ? (
                          <span className="text-red-600 text-sm font-medium">Cancelled</span>
                        ) : (
                          <span className="text-gray-500 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Completed
                          </span>
                        )}
                        <p className="text-gray-900 font-medium mt-1">₹{booking.total_amount}</p>
                      </div>
                    </div>
                    {booking.status === 'cancelled' && booking.cancellation_reason && (
                      <p className="text-red-600 text-xs mt-2">
                        Reason: {booking.cancellation_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Please select a reason for cancellation. This helps us improve our service.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={cancelReason} onValueChange={setCancelReason} className="space-y-3">
            {cancellationReasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason} className="flex-1 cursor-pointer">{reason}</Label>
              </div>
            ))}
          </RadioGroup>

          {cancelReason === 'Other' && (
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please specify your reason..."
              className="mt-3"
            />
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button 
              onClick={handleCancelBooking}
              disabled={!cancelReason || (cancelReason === 'Other' && !customReason) || cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={!newPassword || !confirmPassword || changingPassword}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}