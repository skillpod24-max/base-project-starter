import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, Clock, MapPin, Trophy, AlertCircle, CheckCircle, ArrowLeft, LogOut, Star, Lock, Award, TrendingUp, Heart, Eye, EyeOff, Sparkles, Zap, Gift } from 'lucide-react';
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

  const stats = useMemo(() => {
    const completedBookings = bookings.filter(b => 
      b.status !== 'cancelled' && new Date(`${b.booking_date}T${b.end_time}`) <= new Date()
    );
    
    const totalBookings = completedBookings.length;
    const totalSpent = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const loyaltyPoints = Math.floor(totalSpent / 100) * 10;
    
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const score = Math.max(0, Math.min(100, 100 - (cancelledCount * 10) + (totalBookings * 2)));
    
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Card - Redesigned */}
        <div className="relative bg-gradient-to-br from-primary/10 via-card to-primary/5 rounded-3xl border border-border p-6 sm:p-8 mb-6 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl shadow-primary/30">
              <span className="text-4xl font-bold text-primary-foreground">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{profile?.name || 'User'}</h1>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-card/80 px-3 py-1.5 rounded-full text-sm">
                  <Phone className="w-4 h-4 text-primary" />
                  {profile?.phone || 'No phone'}
                </span>
                {profile?.email && (
                  <span className="flex items-center gap-1.5 bg-card/80 px-3 py-1.5 rounded-full text-sm">
                    <User className="w-4 h-4 text-primary" />
                    {profile.email}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)} className="gap-2 rounded-xl border-primary/30">
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
          </div>
        </div>

        {/* Stats Cards - Redesigned */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-warning/10 to-card rounded-2xl border border-warning/20 p-5 text-center group hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-warning" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.loyaltyPoints}</p>
            <p className="text-muted-foreground text-sm mt-1">Loyalty Points</p>
          </div>
          
          <div className="bg-gradient-to-br from-success/10 to-card rounded-2xl border border-success/20 p-5 text-center group hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.score}</p>
            <p className="text-muted-foreground text-sm mt-1">Booking Score</p>
          </div>
          
          <div className="bg-gradient-to-br from-primary/10 to-card rounded-2xl border border-primary/20 p-5 text-center group hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.totalBookings}</p>
            <p className="text-muted-foreground text-sm mt-1">Total Bookings</p>
          </div>
          
          <div className="bg-gradient-to-br from-destructive/10 to-card rounded-2xl border border-destructive/20 p-5 text-center group hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              {stats.favoriteSport ? (
                <>
                  <span className="text-3xl">{sportIcons[stats.favoriteSport] || '🏟️'}</span>
                </>
              ) : '-'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">Favorite Sport</p>
          </div>
        </div>

        {/* Bookings Tabs - Redesigned */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger value="upcoming" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Calendar className="w-4 h-4" />
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Clock className="w-4 h-4" />
              History ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {loadingBookings ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-10 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-2">No upcoming bookings</p>
                <p className="text-muted-foreground text-sm mb-4">Ready to play? Book a turf now!</p>
                <Link to="/">
                  <Button className="rounded-xl bg-primary hover:bg-primary/90">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Book a Turf
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="bg-card rounded-2xl border border-primary/20 p-5 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                          {sportIcons[booking.sport_type || booking.turf.sport_type] || '🏟️'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{booking.turf.name}</h3>
                          <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {booking.turf.location || 'No location'}
                          </p>
                        </div>
                      </div>
                      <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                        {booking.turf.sport_type}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 bg-muted/50 rounded-xl p-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        {format(parseISO(booking.booking_date), 'EEEE, MMM d')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="font-bold text-foreground text-xl">₹{booking.total_amount}</span>
                      {canCancelBooking(booking) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(booking)}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl"
                        >
                          Cancel Booking
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                          <AlertCircle className="w-3.5 h-3.5" />
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
              <div className="bg-card rounded-2xl border border-border p-10 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No past bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className={cn(
                      "bg-card rounded-2xl border p-4 transition-all",
                      booking.status === 'cancelled' ? 'border-destructive/20 bg-destructive/5' : 'border-border hover:shadow-sm'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                          {sportIcons[booking.sport_type || booking.turf.sport_type] || '🏟️'}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{booking.turf.name}</h3>
                          <p className="text-muted-foreground text-sm mt-0.5">
                            {format(parseISO(booking.booking_date), 'MMM d, yyyy')} • {booking.start_time.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {booking.status === 'cancelled' ? (
                          <span className="text-destructive text-sm font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Cancelled
                          </span>
                        ) : (
                          <span className="text-success text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </span>
                        )}
                        <p className="text-foreground font-semibold mt-1">₹{booking.total_amount}</p>
                      </div>
                    </div>
                    {booking.status === 'cancelled' && booking.cancellation_reason && (
                      <p className="text-destructive/80 text-xs mt-3 bg-destructive/10 rounded-lg px-3 py-2">
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Please select a reason for cancellation. This helps us improve our service.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={cancelReason} onValueChange={setCancelReason} className="space-y-3">
            {cancellationReasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-3 p-3 border border-border rounded-xl hover:bg-muted/50 transition-colors">
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
              className="mt-3 rounded-xl"
            />
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="rounded-xl">
              Keep Booking
            </Button>
            <Button 
              onClick={handleCancelBooking}
              disabled={!cancelReason || (cancelReason === 'Other' && !customReason) || cancelling}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
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
                  className="rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={!newPassword || !confirmPassword || changingPassword}
              className="bg-primary hover:bg-primary/90 rounded-xl"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
