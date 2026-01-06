import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { TrendingUp, Calendar, DollarSign, Zap, Clock, Target, BarChart3 } from 'lucide-react';

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: any;
  onSuccess: () => void;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

const offerTypes = [
  { value: 'discount', label: 'Discount (% or ₹)' },
  { value: 'free_addon', label: 'Free Add-on' },
  { value: 'bundle', label: 'Bundle Deal' },
  { value: 'surprise_reward', label: 'Surprise Reward' },
  { value: 'limited_access', label: 'Limited Access' },
];

const revenueStrategies = [
  { value: 'fill_empty_slots', label: '🟢 Fill Empty Slots', desc: 'Auto-discount empty slots to avoid revenue loss' },
  { value: 'weekday_boost', label: '🟡 Increase Weekday Bookings', desc: 'Target slower weekday times' },
  { value: 'increase_value', label: '🔵 Increase Average Booking Value', desc: 'Encourage longer bookings' },
  { value: 'promote_new', label: '🔴 Promote New Turf', desc: 'Boost visibility for new listings' },
];

const timeDecaySlots = [
  { value: '06-08', label: '6-8 AM' },
  { value: '08-10', label: '8-10 AM' },
  { value: '10-12', label: '10-12 PM' },
  { value: '12-14', label: '12-2 PM' },
  { value: '14-16', label: '2-4 PM' },
  { value: '16-18', label: '4-6 PM' },
];

export function OfferDialog({ open, onOpenChange, offer, onSuccess }: OfferDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [turfs, setTurfs] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    offer_title: '',
    description: '',
    urgency_text: '',
    offer_type: 'discount',
    discount_type: 'percentage',
    discount_value: 10,
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    applicable_days: [] as string[],
    applicable_hours: [] as string[],
    show_hours_before: '',
    max_redemptions: '',
    min_players: '',
    first_come_limit: '',
    turf_id: '',
    is_active: true,
    // Smart Offer Engine fields
    revenue_strategy: 'fill_empty_slots',
    time_decay_enabled: false,
    time_decay_days: [] as string[],
    time_decay_hours: [] as string[],
    max_time_decay_discount: '',
  });

  useEffect(() => {
    if (user) fetchTurfs();
  }, [user]);

  useEffect(() => {
    if (offer) {
      setFormData({
        name: offer.name,
        offer_title: offer.offer_title || '',
        description: offer.description || '',
        urgency_text: offer.urgency_text || '',
        offer_type: offer.offer_type || 'discount',
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
        valid_from: offer.valid_from,
        valid_until: offer.valid_until,
        applicable_days: offer.applicable_days || [],
        applicable_hours: offer.applicable_hours || [],
        show_hours_before: offer.show_hours_before?.toString() || '',
        max_redemptions: offer.max_redemptions?.toString() || '',
        min_players: offer.min_players?.toString() || '',
        first_come_limit: offer.first_come_limit?.toString() || '',
        turf_id: offer.turf_id || '',
        is_active: offer.is_active,
        revenue_strategy: offer.revenue_strategy || 'fill_empty_slots',
        time_decay_enabled: offer.time_decay_enabled || false,
        time_decay_days: offer.time_decay_days || [],
        time_decay_hours: offer.time_decay_hours || [],
        max_time_decay_discount: offer.max_time_decay_discount?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        offer_title: '',
        description: '',
        urgency_text: '',
        offer_type: 'discount',
        discount_type: 'percentage',
        discount_value: 10,
        valid_from: format(new Date(), 'yyyy-MM-dd'),
        valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        applicable_days: [],
        applicable_hours: [],
        show_hours_before: '',
        max_redemptions: '',
        min_players: '',
        first_come_limit: '',
        turf_id: '',
        is_active: true,
        revenue_strategy: 'fill_empty_slots',
        time_decay_enabled: false,
        time_decay_days: [],
        time_decay_hours: [],
        max_time_decay_discount: '',
      });
    }
  }, [offer]);

  const fetchTurfs = async () => {
    if (!user) return;
    const { data } = await supabase.from('turfs').select('id, name').eq('user_id', user.id);
    setTurfs(data || []);
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      applicable_days: prev.applicable_days.includes(day)
        ? prev.applicable_days.filter(d => d !== day)
        : [...prev.applicable_days, day]
    }));
  };

  const handleHourToggle = (hour: string) => {
    setFormData(prev => ({
      ...prev,
      applicable_hours: prev.applicable_hours.includes(hour)
        ? prev.applicable_hours.filter(h => h !== hour)
        : [...prev.applicable_hours, hour]
    }));
  };

  const handleDecayDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      time_decay_days: prev.time_decay_days.includes(day)
        ? prev.time_decay_days.filter(d => d !== day)
        : [...prev.time_decay_days, day]
    }));
  };

  const handleDecayHourToggle = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      time_decay_hours: prev.time_decay_hours.includes(slot)
        ? prev.time_decay_hours.filter(h => h !== slot)
        : [...prev.time_decay_hours, slot]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const offerData = {
      user_id: user.id,
      name: formData.name,
      offer_title: formData.offer_title || null,
      description: formData.description || null,
      urgency_text: formData.urgency_text || null,
      offer_type: formData.offer_type,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until,
      applicable_days: formData.applicable_days.length > 0 ? formData.applicable_days : null,
      applicable_hours: formData.applicable_hours.length > 0 ? formData.applicable_hours : null,
      show_hours_before: formData.show_hours_before ? parseInt(formData.show_hours_before) : null,
      max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
      min_players: formData.min_players ? parseInt(formData.min_players) : null,
      first_come_limit: formData.first_come_limit ? parseInt(formData.first_come_limit) : null,
      turf_id: formData.turf_id || null,
      is_active: formData.is_active,
      revenue_strategy: formData.revenue_strategy,
      time_decay_enabled: formData.time_decay_enabled,
      time_decay_days: formData.time_decay_days.length > 0 ? formData.time_decay_days : null,
      time_decay_hours: formData.time_decay_hours.length > 0 ? formData.time_decay_hours : null,
      max_time_decay_discount: formData.max_time_decay_discount ? parseFloat(formData.max_time_decay_discount) : null,
    };

    let error;
    if (offer) {
      ({ error } = await supabase.from('offers').update(offerData).eq('id', offer.id));
    } else {
      ({ error } = await supabase.from('offers').insert(offerData));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Offer ${offer ? 'updated' : 'created'} successfully` });
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offer ? 'Edit Offer' : 'Create Smart Offer'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="urgency">Urgency</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Offer Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Morning Special"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Title (Short)</Label>
                  <Input
                    value={formData.offer_title}
                    onChange={(e) => setFormData({ ...formData, offer_title: e.target.value })}
                    placeholder="e.g., 🔥 50% OFF"
                    maxLength={32}
                  />
                  <p className="text-xs text-muted-foreground">{formData.offer_title.length}/32 chars</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description shown on turf page..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Offer Type</Label>
                  <Select value={formData.offer_type} onValueChange={(v) => setFormData({ ...formData, offer_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {offerTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Apply to Turf</Label>
                  <Select value={formData.turf_id || "all"} onValueChange={(v) => setFormData({ ...formData, turf_id: v === "all" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Turfs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All My Turfs</SelectItem>
                      {turfs.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (₹)</SelectItem>
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
                <div className="space-y-2 flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    required
                  />
                </div>
              </div>
            </TabsContent>

            {/* Revenue Strategy Tab */}
            <TabsContent value="strategy" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">Revenue Strategy</p>
                </div>
                <p className="text-sm text-blue-700">
                  Choose your goal. The system will optimize urgency, timing, and messaging automatically.
                </p>
              </div>

              <div className="space-y-3">
                {revenueStrategies.map((strategy) => (
                  <label
                    key={strategy.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.revenue_strategy === strategy.value
                        ? 'bg-primary/5 border-primary ring-2 ring-primary/20'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="revenue_strategy"
                      value={strategy.value}
                      checked={formData.revenue_strategy === strategy.value}
                      onChange={(e) => setFormData({ ...formData, revenue_strategy: e.target.value })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{strategy.label}</p>
                      <p className="text-sm text-muted-foreground">{strategy.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Time Decay Pricing */}
              <div className="border-t pt-4 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.time_decay_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, time_decay_enabled: checked as boolean })}
                    />
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="font-medium">Smart Empty-Slot Filler</span>
                    </div>
                  </label>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Automatically applies small discounts to selected low-demand slots to avoid revenue loss from empty turf time.
                </p>

                {formData.time_decay_enabled && (
                  <div className="space-y-4 bg-amber-50/50 border border-amber-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <Label>Apply on Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                          <label 
                            key={day} 
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                              formData.time_decay_days.includes(day) 
                                ? 'bg-amber-100 border-amber-400' 
                                : 'bg-white border-border hover:border-amber-300'
                            }`}
                          >
                            <Checkbox
                              checked={formData.time_decay_days.includes(day)}
                              onCheckedChange={() => handleDecayDayToggle(day)}
                            />
                            <span className="text-sm">{day.slice(0, 3)}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Weekends are excluded by default for peak protection</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Time Slots (Low-Demand Hours Only)</Label>
                      <div className="flex flex-wrap gap-2">
                        {timeDecaySlots.map((slot) => (
                          <button
                            type="button"
                            key={slot.value}
                            onClick={() => handleDecayHourToggle(slot.value)}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                              formData.time_decay_hours.includes(slot.value)
                                ? 'bg-amber-500 text-white'
                                : 'bg-white border border-border hover:border-amber-400'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Peak hours (4PM-10PM) are excluded</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Discount Cap</Label>
                      <div className="flex gap-2">
                        {['10', '15', '20'].map((val) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setFormData({ ...formData, max_time_decay_discount: val })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              formData.max_time_decay_discount === val
                                ? 'bg-amber-500 text-white'
                                : 'bg-white border border-border hover:border-amber-400'
                            }`}
                          >
                            Max {val}%
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        System will never exceed this discount. Stops auto-discounting when slots start filling.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-amber-200">
                      <p className="text-sm font-medium text-amber-800 mb-2">⏱️ How Time Decay Works</p>
                      <div className="text-xs text-amber-700 space-y-1">
                        <p>• 24+ hrs before: 0% discount</p>
                        <p>• 12-24 hrs: 5% discount</p>
                        <p>• 6-12 hrs: 10% discount</p>
                        <p>• 2-6 hrs: 15% discount</p>
                        <p>• &lt;2 hrs: Max cap ({formData.max_time_decay_discount || '20'}%)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4">
              <div className="space-y-2">
                <Label>Applicable Days (leave empty for all days)</Label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <label 
                      key={day} 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        formData.applicable_days.includes(day) 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        checked={formData.applicable_days.includes(day)}
                        onCheckedChange={() => handleDayToggle(day)}
                      />
                      <span className="text-sm">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applicable Hours (leave empty for all hours)</Label>
                <div className="flex flex-wrap gap-1">
                  {hours.map((hour) => (
                    <button
                      type="button"
                      key={hour}
                      onClick={() => handleHourToggle(hour)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        formData.applicable_hours.includes(hour)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {hour}:00
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Players Required</Label>
                  <Input
                    type="number"
                    value={formData.min_players}
                    onChange={(e) => setFormData({ ...formData, min_players: e.target.value })}
                    placeholder="No minimum"
                  />
                </div>
                <div className="space-y-2">
                  <Label>First Come Limit</Label>
                  <Input
                    type="number"
                    value={formData.first_come_limit}
                    onChange={(e) => setFormData({ ...formData, first_come_limit: e.target.value })}
                    placeholder="No limit"
                  />
                  <p className="text-xs text-muted-foreground">First N bookings only</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="urgency" className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  💡 <strong>Tip:</strong> Urgency text appears on the turf card. Keep it short (max 28 chars) and action-oriented!
                </p>
              </div>

              <div className="space-y-2">
                <Label>Custom Urgency Text (Optional)</Label>
                <Input
                  value={formData.urgency_text}
                  onChange={(e) => setFormData({ ...formData, urgency_text: e.target.value })}
                  placeholder="e.g., Only 2 slots left! 🔥"
                  maxLength={28}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.urgency_text.length}/28 chars • If empty, system will auto-generate based on demand
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">System-Generated Urgency</p>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  The system automatically creates urgency messages based on real data:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded p-2 border border-blue-100">⏳ "Ends in 2h 14m"</div>
                  <div className="bg-white rounded p-2 border border-blue-100">🔥 "Almost full"</div>
                  <div className="bg-white rounded p-2 border border-blue-100">⚡ "Last chance"</div>
                  <div className="bg-white rounded p-2 border border-blue-100">📈 "High demand today"</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Show X Hours Before Slot</Label>
                  <Input
                    type="number"
                    value={formData.show_hours_before}
                    onChange={(e) => setFormData({ ...formData, show_hours_before: e.target.value })}
                    placeholder="Always visible"
                  />
                  <p className="text-xs text-muted-foreground">Creates last-minute urgency</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Redemptions</Label>
                  <Input
                    type="number"
                    value={formData.max_redemptions}
                    onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value })}
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-muted-foreground">Shows "Only X left!" when low</p>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Preview on Turf Card</p>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold inline-flex items-center gap-1">
                  🔥 {formData.urgency_text || formData.offer_title || `${formData.discount_value}${formData.discount_type === 'percentage' ? '%' : '₹'} OFF`}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : offer ? 'Update Offer' : 'Create Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}