import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, Gift, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Turf {
  id: string;
  name: string;
}

interface FirstBookingOffer {
  id: string;
  turf_id: string | null;
  booking_number: number;
  discount_type: string;
  discount_value: number;
  applicable_days: string[];
  start_hour: number;
  end_hour: number;
  is_active: boolean;
  offer_title: string | null;
  urgency_text: string | null;
  turfs?: { name: string };
}

const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function FirstBookingOffers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [offers, setOffers] = useState<FirstBookingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<FirstBookingOffer | null>(null);

  const [formData, setFormData] = useState({
    turf_id: '',
    booking_number: 1,
    discount_type: 'fixed',
    discount_value: 0,
    applicable_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    start_hour: 6,
    end_hour: 16,
    offer_title: '',
    urgency_text: '',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchTurfs();
      fetchOffers();
    }
  }, [user]);

  const fetchTurfs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('turfs')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true);
    setTurfs(data || []);
  };

  const fetchOffers = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('first_booking_offers')
      .select('*, turfs(name)')
      .eq('user_id', user.id)
      .order('booking_number', { ascending: true });
    setOffers(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const offerData = {
      user_id: user.id,
      turf_id: formData.turf_id || null,
      booking_number: formData.booking_number,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      applicable_days: formData.applicable_days,
      start_hour: formData.start_hour,
      end_hour: formData.end_hour,
      offer_title: formData.offer_title || null,
      urgency_text: formData.urgency_text || null,
      is_active: formData.is_active,
    };

    let error;
    if (editingOffer) {
      ({ error } = await (supabase as any)
        .from('first_booking_offers')
        .update(offerData)
        .eq('id', editingOffer.id));
    } else {
      ({ error } = await (supabase as any)
        .from('first_booking_offers')
        .insert(offerData));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Offer ${editingOffer ? 'updated' : 'created'} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchOffers();
    }
  };

  const handleEdit = (offer: FirstBookingOffer) => {
    setEditingOffer(offer);
    setFormData({
      turf_id: offer.turf_id || '',
      booking_number: offer.booking_number,
      discount_type: offer.discount_type,
      discount_value: offer.discount_value,
      applicable_days: offer.applicable_days || [],
      start_hour: offer.start_hour,
      end_hour: offer.end_hour,
      offer_title: offer.offer_title || '',
      urgency_text: offer.urgency_text || '',
      is_active: offer.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    await (supabase as any).from('first_booking_offers').delete().eq('id', id);
    toast({ title: 'Deleted' });
    fetchOffers();
  };

  const toggleActive = async (offer: FirstBookingOffer) => {
    await (supabase as any)
      .from('first_booking_offers')
      .update({ is_active: !offer.is_active })
      .eq('id', offer.id);
    fetchOffers();
  };

  const resetForm = () => {
    setEditingOffer(null);
    setFormData({
      turf_id: '',
      booking_number: 1,
      discount_type: 'fixed',
      discount_value: 0,
      applicable_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      start_hour: 6,
      end_hour: 16,
      offer_title: '',
      urgency_text: '',
      is_active: true,
    });
  };

  const getBookingLabel = (num: number) => {
    const labels: Record<number, string> = {
      1: '1st Booking',
      2: '2nd Booking',
      3: '3rd Booking',
      4: '4th Booking',
      5: '5th Booking',
    };
    return labels[num] || `${num}th Booking`;
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>First Booking Offers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure special offers for first-time customers
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Offer
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">First Booking Offers Engine</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create offers for 1st, 2nd, 3rd booking customers. These offers are shown when customers 
              select a slot during eligible days/hours. Perfect for filling slow weekday slots!
            </p>
          </div>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No first booking offers configured</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Your First Offer
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-card border rounded-lg p-4 ${!offer.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">{getBookingLabel(offer.booking_number)}</span>
                    <p className="text-sm text-muted-foreground">
                      {offer.turfs?.name || 'All Turfs'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  offer.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                }`}>
                  {offer.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">
                    {offer.discount_type === 'percentage' 
                      ? `${offer.discount_value}%` 
                      : `₹${offer.discount_value}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days</span>
                  <span className="text-xs">{offer.applicable_days?.join(', ') || 'All'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hours</span>
                  <span>{offer.start_hour}:00 - {offer.end_hour}:00</span>
                </div>
              </div>

              {offer.offer_title && (
                <div className="bg-muted/50 rounded-lg p-2 mb-3">
                  <p className="text-xs font-medium">{offer.offer_title}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(offer)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleActive(offer)}>
                  <Power className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(offer.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Edit Offer' : 'New First Booking Offer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Booking Number</Label>
                <Select
                  value={formData.booking_number.toString()}
                  onValueChange={(v) => setFormData({ ...formData, booking_number: parseInt(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{getBookingLabel(n)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turf (Optional)</Label>
                <Select
                  value={formData.turf_id || 'all'}
                  onValueChange={(v) => setFormData({ ...formData, turf_id: v === 'all' ? '' : v })}
                >
                  <SelectTrigger><SelectValue placeholder="All Turfs" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Turfs</SelectItem>
                    {turfs.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicable Days</Label>
              <div className="grid grid-cols-4 gap-2">
                {dayOptions.map((day) => (
                  <label key={day} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.applicable_days.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, applicable_days: [...formData.applicable_days, day] });
                        } else {
                          setFormData({ ...formData, applicable_days: formData.applicable_days.filter(d => d !== day) });
                        }
                      }}
                      className="rounded"
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Hour</Label>
                <Select
                  value={formData.start_hour.toString()}
                  onValueChange={(v) => setFormData({ ...formData, start_hour: parseInt(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>{i}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Hour</Label>
                <Select
                  value={formData.end_hour.toString()}
                  onValueChange={(v) => setFormData({ ...formData, end_hour: parseInt(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>{i}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Offer Title (Shown to customer)</Label>
              <Input
                value={formData.offer_title}
                onChange={(e) => setFormData({ ...formData, offer_title: e.target.value })}
                placeholder="e.g., First Timer Bonus!"
              />
            </div>

            <div className="space-y-2">
              <Label>Urgency Text</Label>
              <Input
                value={formData.urgency_text}
                onChange={(e) => setFormData({ ...formData, urgency_text: e.target.value })}
                placeholder="e.g., Book now & grab your reward!"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingOffer ? 'Update' : 'Create'} Offer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
