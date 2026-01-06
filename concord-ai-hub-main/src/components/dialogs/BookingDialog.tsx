import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Turf {
  id: string;
  name: string;
  sport_type: string;
  base_price: number;
  price_1h: number | null;
  price_2h: number | null;
  price_3h: number | null;
  weekday_price: number | null;
  weekend_price: number | null;
  slot_duration: number;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: any;
  onSuccess: () => void;
  defaultDate?: Date;
  defaultTurfId?: string;
  defaultTime?: string;
}

export function BookingDialog({ 
  open, 
  onOpenChange, 
  booking, 
  onSuccess,
  defaultDate,
  defaultTurfId,
  defaultTime 
}: BookingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [formData, setFormData] = useState({
    customer_id: '',
    turf_id: '',
    booking_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '06:00',
    end_time: '07:00',
    duration_hours: 1,
    sport_type: '',
    total_amount: 0,
    discount_amount: 0,
    advance_amount: 0,
    paid_amount: 0,
    payment_mode: 'cash',
    payment_status: 'pending',
    notes: '',
  });

  useEffect(() => {
    if (open && user) {
      fetchData();
    }
  }, [open, user]);

  useEffect(() => {
    if (booking) {
      setFormData({
        customer_id: booking.customer_id,
        turf_id: booking.turf_id,
        booking_date: booking.booking_date,
        start_time: booking.start_time?.slice(0, 5) || '06:00',
        end_time: booking.end_time?.slice(0, 5) || '07:00',
        duration_hours: 1,
        sport_type: booking.sport_type,
        total_amount: booking.total_amount,
        discount_amount: 0,
        advance_amount: 0,
        paid_amount: booking.paid_amount || 0,
        payment_mode: booking.payment_mode || 'cash',
        payment_status: booking.payment_status,
        notes: booking.notes || '',
      });
    } else {
      setFormData({
        customer_id: '',
        turf_id: defaultTurfId || '',
        booking_date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        start_time: defaultTime || '06:00',
        end_time: defaultTime ? calculateEndTime(defaultTime, 1) : '07:00',
        duration_hours: 1,
        sport_type: '',
        total_amount: 0,
        discount_amount: 0,
        advance_amount: 0,
        paid_amount: 0,
        payment_mode: 'cash',
        payment_status: 'pending',
        notes: '',
      });
      setIsNewCustomer(false);
      setNewCustomer({ name: '', phone: '', email: '' });
    }
  }, [booking, defaultDate, defaultTurfId, defaultTime]);

  const calculateEndTime = (startTime: string, hours: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const endH = h + hours;
    return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const fetchData = async () => {
    if (!user) return;
    
    const [customersRes, turfsRes] = await Promise.all([
      supabase.from('customers').select('id, name, phone').eq('user_id', user.id).order('name'),
      supabase.from('turfs').select('*').eq('user_id', user.id).eq('is_active', true),
    ]);

    setCustomers(customersRes.data || []);
    setTurfs(turfsRes.data || []);

    // Auto-select turf if defaultTurfId provided
    if (defaultTurfId && turfsRes.data) {
      const turf = turfsRes.data.find(t => t.id === defaultTurfId);
      if (turf) {
        handleTurfChange(defaultTurfId);
      }
    }
  };

  const calculatePrice = (turf: Turf, hours: number, date: string) => {
    const day = new Date(date).getDay();
    const isWeekend = day === 0 || day === 6;

    // Check package prices first
    if (hours === 1 && turf.price_1h) return turf.price_1h;
    if (hours === 2 && turf.price_2h) return turf.price_2h;
    if (hours === 3 && turf.price_3h) return turf.price_3h;

    // Then check weekday/weekend prices
    if (isWeekend && turf.weekend_price) return turf.weekend_price * hours;
    if (!isWeekend && turf.weekday_price) return turf.weekday_price * hours;

    // Fall back to base price
    return turf.base_price * hours;
  };

  const handleTurfChange = (turfId: string) => {
    const turf = turfs.find(t => t.id === turfId);
    if (turf) {
      const price = calculatePrice(turf, formData.duration_hours, formData.booking_date);
      const endTime = calculateEndTime(formData.start_time, formData.duration_hours);
      setFormData({
        ...formData,
        turf_id: turfId,
        sport_type: turf.sport_type,
        total_amount: price,
        end_time: endTime,
      });
    }
  };

  const handleDurationChange = (hours: number) => {
    const turf = turfs.find(t => t.id === formData.turf_id);
    const price = turf ? calculatePrice(turf, hours, formData.booking_date) : 0;
    const endTime = calculateEndTime(formData.start_time, hours);
    setFormData({
      ...formData,
      duration_hours: hours,
      total_amount: price - formData.discount_amount,
      end_time: endTime,
    });
  };

  const handleDiscountChange = (discount: number) => {
    const turf = turfs.find(t => t.id === formData.turf_id);
    const basePrice = turf ? calculatePrice(turf, formData.duration_hours, formData.booking_date) : 0;
    setFormData({
      ...formData,
      discount_amount: discount,
      total_amount: Math.max(0, basePrice - discount),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    let customerId = formData.customer_id;

    // Create new customer if needed
    if (isNewCustomer) {
      if (!newCustomer.name || !newCustomer.phone) {
        toast({ title: 'Error', description: 'Customer name and phone are required', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { data: newCustomerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email || null,
        })
        .select('id')
        .single();

      if (customerError) {
        toast({ title: 'Error', description: customerError.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      customerId = newCustomerData.id;
    }

    if (!customerId) {
      toast({ title: 'Error', description: 'Please select or create a customer', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const totalPaid = formData.advance_amount + formData.paid_amount;
    const paymentStatus = totalPaid >= formData.total_amount ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';

    const bookingData = {
      user_id: user.id,
      customer_id: customerId,
      turf_id: formData.turf_id,
      booking_date: formData.booking_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      sport_type: formData.sport_type,
      total_amount: formData.total_amount,
      paid_amount: totalPaid,
      payment_mode: formData.payment_mode,
      payment_status: paymentStatus,
      notes: formData.notes,
      status: 'booked',
    };

    let error;
    if (booking) {
      ({ error } = await supabase.from('bookings').update(bookingData).eq('id', booking.id));
    } else {
      ({ error } = await supabase.from('bookings').insert(bookingData));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Booking ${booking ? 'updated' : 'created'} successfully` });
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const finalAmount = formData.total_amount - formData.discount_amount;
  const pendingAmount = finalAmount - formData.advance_amount - formData.paid_amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{booking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Customer</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">New Customer</span>
                <Switch checked={isNewCustomer} onCheckedChange={setIsNewCustomer} />
              </div>
            </div>
            
            {isNewCustomer ? (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                <Input 
                  placeholder="Customer Name *" 
                  value={newCustomer.name} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                />
                <Input 
                  placeholder="Phone Number *" 
                  value={newCustomer.phone} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
                />
                <Input 
                  placeholder="Email (optional)" 
                  type="email"
                  value={newCustomer.email} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} 
                />
              </div>
            ) : (
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Turf & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.booking_date} onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Turf</Label>
              <Select value={formData.turf_id} onValueChange={handleTurfChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select turf" />
                </SelectTrigger>
                <SelectContent>
                  {turfs.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={formData.start_time} onChange={(e) => {
                const endTime = calculateEndTime(e.target.value, formData.duration_hours);
                setFormData({ ...formData, start_time: e.target.value, end_time: endTime });
              }} required />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={formData.duration_hours.toString()} onValueChange={(v) => handleDurationChange(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="2">2 Hours</SelectItem>
                  <SelectItem value="3">3 Hours</SelectItem>
                  <SelectItem value="4">4 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={formData.end_time} disabled className="bg-muted" />
            </div>
          </div>

          {/* Pricing */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex justify-between">
              <span className="text-sm">Base Amount</span>
              <span className="font-medium">₹{formData.total_amount + formData.discount_amount}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Discount</Label>
              <Input 
                type="number" 
                className="w-24 h-8 text-right" 
                value={formData.discount_amount || ''} 
                onChange={(e) => handleDiscountChange(Number(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="flex justify-between font-medium text-lg border-t pt-2">
              <span>Total Amount</span>
              <span className="text-primary">₹{formData.total_amount}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Advance Paid (₹)</Label>
              <Input type="number" value={formData.advance_amount || ''} onChange={(e) => setFormData({ ...formData, advance_amount: Number(e.target.value) || 0 })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Paid Now (₹)</Label>
              <Input type="number" value={formData.paid_amount || ''} onChange={(e) => setFormData({ ...formData, paid_amount: Number(e.target.value) || 0 })} placeholder="0" />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm p-3 bg-warning/10 rounded-lg">
            <span>Pending Amount</span>
            <span className="font-bold text-warning">₹{Math.max(0, pendingAmount)}</span>
          </div>

          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select value={formData.payment_mode} onValueChange={(v) => setFormData({ ...formData, payment_mode: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special notes..." rows={2} />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Saving...' : booking ? 'Update Booking' : 'Create Booking'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
