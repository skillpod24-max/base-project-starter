import { useState, useEffect } from 'react';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { BookingDialog } from '@/components/dialogs/BookingDialog';
import { DetailDialog } from '@/components/dialogs/DetailDialog';
import { SlotCalendar } from '@/components/SlotCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Bookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [defaultDate, setDefaultDate] = useState<Date>();
  const [defaultTurfId, setDefaultTurfId] = useState<string>();
  const [defaultTime, setDefaultTime] = useState<string>();

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookings')
      .select('*, customers(name, phone), turfs(name)')
      .eq('user_id', user.id)
      .order('booking_date', { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  const handleSlotClick = (date: Date, time: string, turfId: string) => {
    setDefaultDate(date);
    setDefaultTime(time);
    setDefaultTurfId(turfId);
    setSelectedBooking(null);
    setDialogOpen(true);
  };

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const handleEdit = () => {
    setDetailOpen(false);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBooking || !confirm('Delete this booking?')) return;
    const { error } = await supabase.from('bookings').delete().eq('id', selectedBooking.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Booking deleted successfully' });
      setDetailOpen(false);
      fetchBookings();
    }
  };

  const filtered = bookings.filter(b =>
    b.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.turfs?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-container flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Bookings</h1>
        <Button onClick={() => { setSelectedBooking(null); setDefaultDate(undefined); setDefaultTime(undefined); setDefaultTurfId(undefined); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />New Booking
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <SlotCalendar onSlotClick={handleSlotClick} onBookingClick={handleBookingClick} />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="bg-card border rounded-lg overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Customer</th><th>Turf</th><th>Time</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No bookings found</td></tr>
                ) : filtered.map((b) => (
                  <tr key={b.id} onClick={() => handleBookingClick(b)} className="cursor-pointer">
                    <td>{format(new Date(b.booking_date), 'MMM d, yyyy')}</td>
                    <td className="font-medium">{b.customers?.name}</td>
                    <td>{b.turfs?.name}</td>
                    <td>{b.start_time?.slice(0, 5)}</td>
                    <td>₹{b.total_amount}</td>
                    <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <BookingDialog open={dialogOpen} onOpenChange={setDialogOpen} booking={selectedBooking} onSuccess={fetchBookings} defaultDate={defaultDate} defaultTurfId={defaultTurfId} defaultTime={defaultTime} />
      {selectedBooking && <DetailDialog open={detailOpen} onOpenChange={setDetailOpen} title="Booking Details" data={selectedBooking} onEdit={handleEdit} onDelete={handleDelete} />}
    </div>
  );
}