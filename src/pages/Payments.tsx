import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DetailDialog } from '@/components/dialogs/DetailDialog';
import { useToast } from '@/hooks/use-toast';
import { Check, AlertCircle, Clock, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface Booking {
  id: string;
  booking_date: string;
  total_amount: number;
  paid_amount: number | null;
  pending_amount: number | null;
  payment_status: string;
  payment_mode: string | null;
  customers: { name: string; phone: string } | null;
  turfs: { name: string } | null;
  created_at: string;
}

export default function Payments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [processingBooking, setProcessingBooking] = useState<Booking | null>(null);

  useEffect(() => { if (user) fetchPayments(); }, [user]);

  const fetchPayments = async () => {
    if (!user) return;
    const { data } = await supabase.from('bookings').select('*, customers(name, phone), turfs(name)').eq('user_id', user.id).order('created_at', { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  const handleRecordPayment = async () => {
    if (!processingBooking || !paymentAmount) return;
    
    const newPaidAmount = Number(processingBooking.paid_amount || 0) + Number(paymentAmount);
    const newPendingAmount = processingBooking.total_amount - newPaidAmount;
    const newStatus = newPendingAmount <= 0 ? 'paid' : 'partial';

    const { error } = await supabase.from('bookings').update({
      paid_amount: newPaidAmount,
      payment_status: newStatus,
      payment_mode: paymentMode,
    }).eq('id', processingBooking.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Payment recorded successfully' });
      fetchPayments();
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setProcessingBooking(null);
    }
  };

  const openPaymentDialog = (booking: Booking) => {
    setProcessingBooking(booking);
    setPaymentAmount((booking.pending_amount || 0).toString());
    setPaymentMode(booking.payment_mode || 'cash');
    setPaymentDialogOpen(true);
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'pending') return b.payment_status === 'pending';
    if (filter === 'partial') return b.payment_status === 'partial';
    if (filter === 'paid') return b.payment_status === 'paid';
    return true;
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
  const pendingAmount = bookings.reduce((sum, b) => sum + Number(b.pending_amount || 0), 0);
  const paidCount = bookings.filter(b => b.payment_status === 'paid').length;
  const partialCount = bookings.filter(b => b.payment_status === 'partial').length;
  const pendingCount = bookings.filter(b => b.payment_status === 'pending').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Check className="w-4 h-4 text-success" />;
      case 'partial': return <Clock className="w-4 h-4 text-warning" />;
      default: return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getPaymentModeIcon = (mode: string | null) => {
    switch (mode) {
      case 'upi': return <Smartphone className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      default: return <Banknote className="w-4 h-4" />;
    }
  };

  if (loading) return <div className="page-container flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Payments</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-2xl font-semibold text-success">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Collected</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-semibold text-warning">₹{pendingAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="stat-card bg-success/5">
          <p className="text-2xl font-semibold text-success">{paidCount}</p>
          <p className="text-xs text-muted-foreground">Fully Paid</p>
        </div>
        <div className="stat-card bg-warning/5">
          <p className="text-2xl font-semibold text-warning">{partialCount}</p>
          <p className="text-xs text-muted-foreground">Partial</p>
        </div>
        <div className="stat-card bg-destructive/5">
          <p className="text-2xl font-semibold text-destructive">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Unpaid</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Turf</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No payments found</td></tr>
            ) : filteredBookings.map((b) => (
              <tr key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedBooking(b)}>
                <td>{format(new Date(b.booking_date), 'MMM d')}</td>
                <td>
                  <div>
                    <p className="font-medium">{b.customers?.name}</p>
                    <p className="text-xs text-muted-foreground">{b.customers?.phone}</p>
                  </div>
                </td>
                <td>{b.turfs?.name}</td>
                <td>₹{b.total_amount}</td>
                <td className="text-success">₹{b.paid_amount || 0}</td>
                <td className="text-warning">₹{b.pending_amount || 0}</td>
                <td>
                  <div className="flex items-center gap-1">
                    {getPaymentModeIcon(b.payment_mode)}
                    <span className="capitalize">{b.payment_mode || '-'}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(b.payment_status)}
                    <span className={`status-badge ${
                      b.payment_status === 'paid' ? 'status-available' : 
                      b.payment_status === 'partial' ? 'status-booked' : 'status-blocked'
                    }`}>
                      {b.payment_status}
                    </span>
                  </div>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {b.payment_status !== 'paid' && (
                    <Button size="sm" onClick={() => openPaymentDialog(b)}>
                      Record Payment
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {processingBooking && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm"><strong>Customer:</strong> {processingBooking.customers?.name}</p>
                <p className="text-sm"><strong>Total:</strong> ₹{processingBooking.total_amount}</p>
                <p className="text-sm"><strong>Already Paid:</strong> ₹{processingBooking.paid_amount || 0}</p>
                <p className="text-sm text-warning"><strong>Pending:</strong> ₹{processingBooking.pending_amount || 0}</p>
              </div>
              <div className="space-y-2">
                <Label>Amount Received (₹)</Label>
                <Input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={processingBooking.pending_amount || 0}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleRecordPayment} className="flex-1">Confirm</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        title="Payment Details"
        data={selectedBooking ? {
          'Date': format(new Date(selectedBooking.booking_date), 'MMM d, yyyy'),
          'Customer': selectedBooking.customers?.name || '-',
          'Phone': selectedBooking.customers?.phone || '-',
          'Turf': selectedBooking.turfs?.name || '-',
          'Total Amount': `₹${selectedBooking.total_amount}`,
          'Paid Amount': `₹${selectedBooking.paid_amount || 0}`,
          'Pending Amount': `₹${selectedBooking.pending_amount || 0}`,
          'Payment Mode': selectedBooking.payment_mode || '-',
          'Status': selectedBooking.payment_status,
        } : {}}
      />
    </div>
  );
}