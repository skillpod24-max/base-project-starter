import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Calendar, Percent, IndianRupee, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_booking_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  turf_id: string | null;
}

interface Turf {
  id: string;
  name: string;
}

export default function PromoCodes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_booking_amount: '',
    max_discount: '',
    usage_limit: '',
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    turf_id: 'all',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchPromoCodes();
      fetchTurfs();
    }
  }, [user]);

  const fetchPromoCodes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setPromoCodes(data || []);
    }
    setLoading(false);
  };

  const fetchTurfs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('turfs')
      .select('id, name')
      .eq('user_id', user.id);
    setTurfs(data || []);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TURF';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const promoData = {
      user_id: user.id,
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_booking_amount: formData.min_booking_amount ? Number(formData.min_booking_amount) : 0,
      max_discount: formData.max_discount ? Number(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until,
      turf_id: formData.turf_id === 'all' ? null : formData.turf_id,
      is_active: formData.is_active,
    };

    let error;
    if (editingCode) {
      ({ error } = await supabase.from('promo_codes').update(promoData).eq('id', editingCode.id));
    } else {
      ({ error } = await supabase.from('promo_codes').insert(promoData));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Promo code ${editingCode ? 'updated' : 'created'} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchPromoCodes();
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      min_booking_amount: code.min_booking_amount?.toString() || '',
      max_discount: code.max_discount?.toString() || '',
      usage_limit: code.usage_limit?.toString() || '',
      valid_from: code.valid_from,
      valid_until: code.valid_until,
      turf_id: code.turf_id || 'all',
      is_active: code.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Promo code deleted successfully' });
      fetchPromoCodes();
    }
  };

  const toggleActive = async (code: PromoCode) => {
    const { error } = await supabase.from('promo_codes').update({ is_active: !code.is_active }).eq('id', code.id);
    if (!error) fetchPromoCodes();
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setEditingCode(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_booking_amount: '',
      max_discount: '',
      usage_limit: '',
      valid_from: format(new Date(), 'yyyy-MM-dd'),
      valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      turf_id: 'all',
      is_active: true,
    });
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
          <h1>Promo Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage promotional codes for your turfs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Create Promo Code</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCode ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Promo Code *</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.code} 
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                    placeholder="SUMMER20"
                    className="uppercase"
                    required 
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>Generate</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Summer special discount"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value *</Label>
                  <Input 
                    type="number" 
                    value={formData.discount_value} 
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min. Booking Amount</Label>
                  <Input 
                    type="number" 
                    value={formData.min_booking_amount} 
                    onChange={(e) => setFormData({ ...formData, min_booking_amount: e.target.value })} 
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max. Discount</Label>
                  <Input 
                    type="number" 
                    value={formData.max_discount} 
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })} 
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From *</Label>
                  <Input 
                    type="date" 
                    value={formData.valid_from} 
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until *</Label>
                  <Input 
                    type="date" 
                    value={formData.valid_until} 
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Usage Limit</Label>
                  <Input 
                    type="number" 
                    value={formData.usage_limit} 
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })} 
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apply to Turf</Label>
                  <Select value={formData.turf_id} onValueChange={(v) => setFormData({ ...formData, turf_id: v })}>
                    <SelectTrigger><SelectValue placeholder="All Turfs" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Turfs</SelectItem>
                      {turfs.map((turf) => (
                        <SelectItem key={turf.id} value={turf.id}>{turf.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Enable this promo code</p>
                </div>
                <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
              </div>

              <Button type="submit" className="w-full">{editingCode ? 'Update Promo Code' : 'Create Promo Code'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {promoCodes.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No promo codes created yet</p>
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Your First Promo Code</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promoCodes.map((code) => (
            <div key={code.id} className={`bg-card border rounded-lg p-4 ${!code.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="text-muted-foreground hover:text-foreground">
                        {copiedCode === code.code ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${code.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {code.description && (
                <p className="text-sm text-muted-foreground mb-3">{code.description}</p>
              )}

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  {code.discount_type === 'percentage' ? (
                    <Percent className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <IndianRupee className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span>
                    {code.discount_type === 'percentage' 
                      ? `${code.discount_value}% off` 
                      : `₹${code.discount_value} off`}
                    {code.max_discount && code.discount_type === 'percentage' && ` (max ₹${code.max_discount})`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(code.valid_from), 'MMM d')} - {format(new Date(code.valid_until), 'MMM d, yyyy')}</span>
                </div>
                {code.usage_limit && (
                  <div className="text-muted-foreground">
                    Used: {code.used_count || 0} / {code.usage_limit}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(code)}>
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleActive(code)}>
                  {code.is_active ? 'Disable' : 'Enable'}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(code.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
