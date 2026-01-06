import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BarChart3, Eye, ShoppingCart, DollarSign, TrendingUp, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { OfferDialog } from '@/components/dialogs/OfferDialog';
import { DetailDialog } from '@/components/dialogs/DetailDialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Offer {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  applicable_days: string[] | null;
  applicable_hours: string[] | null;
  is_active: boolean;
  usage_count: number | null;
  views_count: number | null;
  revenue_from_offer: number | null;
  revenue_strategy: string | null;
  time_decay_enabled: boolean | null;
  turf_id: string | null;
}

interface OfferView {
  offer_id: string;
  viewed_at: string;
  converted: boolean;
}

export default function Offers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerViews, setOfferViews] = useState<OfferView[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState('offers');

  useEffect(() => { 
    if (user) {
      fetchOffers();
      fetchOfferViews();
    }
  }, [user]);

  const fetchOffers = async () => {
    if (!user) return;
    const { data } = await supabase.from('offers').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setOffers((data as Offer[]) || []);
    setLoading(false);
  };

  const fetchOfferViews = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('offer_views')
      .select('offer_id, viewed_at, converted')
      .in('offer_id', offers.map(o => o.id));
    setOfferViews(data || []);
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setDialogOpen(true);
    setSelectedOffer(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Offer deleted' });
      fetchOffers();
      setSelectedOffer(null);
    }
  };

  const toggleActive = async (offer: Offer) => {
    const { error } = await supabase.from('offers').update({ is_active: !offer.is_active }).eq('id', offer.id);
    if (!error) fetchOffers();
  };

  const activeOffers = offers.filter(o => o.is_active).length;
  const totalUsage = offers.reduce((sum, o) => sum + (o.usage_count || 0), 0);
  const totalViews = offers.reduce((sum, o) => sum + (o.views_count || 0), 0);
  const totalRevenue = offers.reduce((sum, o) => sum + (o.revenue_from_offer || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalUsage / totalViews) * 100).toFixed(1) : '0';

  const getStrategyLabel = (strategy: string | null) => {
    switch (strategy) {
      case 'fill_empty_slots': return '🟢 Fill Slots';
      case 'weekday_boost': return '🟡 Weekday Boost';
      case 'increase_value': return '🔵 Increase Value';
      case 'promote_new': return '🔴 Promote New';
      default: return '—';
    }
  };

  if (loading) return <div className="page-container flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Smart Offers</h1>
        <Button onClick={() => { setEditingOffer(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Create Offer
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="offers">All Offers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="mt-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Active Offers</p>
              </div>
              <p className="text-2xl font-semibold text-primary">{activeOffers}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-emerald-500" />
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
              <p className="text-2xl font-semibold text-emerald-600">{totalUsage}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
              <p className="text-2xl font-semibold text-blue-600">{totalViews}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
              <p className="text-2xl font-semibold text-amber-600">{conversionRate}%</p>
            </div>
          </div>

          {offers.length === 0 ? (
            <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-medium mb-2">No offers created yet</p>
              <p className="text-sm">Create your first smart offer to boost bookings!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <div 
                  key={o.id} 
                  className={`bg-card border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors ${!o.is_active ? 'opacity-60' : ''}`}
                  onClick={() => setSelectedOffer(o)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{o.name}</h3>
                      <span className="text-xs text-muted-foreground">{getStrategyLabel(o.revenue_strategy)}</span>
                    </div>
                    <span className={`status-badge ${o.is_active ? 'status-available' : 'status-blocked'}`}>
                      {o.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{o.description || 'No description'}</p>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <p className="text-lg font-semibold text-primary">
                      {o.discount_type === 'percentage' ? `${o.discount_value}% OFF` : `₹${o.discount_value} OFF`}
                    </p>
                    {o.time_decay_enabled && (
                      <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Time Decay
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-3 bg-muted/50 rounded-lg p-2">
                    <div>
                      <p className="text-sm font-medium">{o.views_count || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Views</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{o.usage_count || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Bookings</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">₹{o.revenue_from_offer || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Valid: {format(new Date(o.valid_from), 'MMM d')} - {format(new Date(o.valid_until), 'MMM d, yyyy')}
                  </p>
                  
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(o)} className="flex-1">
                      {o.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(o)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(o.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Offer Performance Dashboard</h2>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue from Offers</p>
                <p className="text-2xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Bookings Generated</p>
                <p className="text-2xl font-bold text-emerald-600">{totalUsage}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Offer Impressions</p>
                <p className="text-2xl font-bold text-blue-600">{totalViews}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Avg. Conversion</p>
                <p className="text-2xl font-bold text-amber-600">{conversionRate}%</p>
              </div>
            </div>

            {/* Per-Offer Breakdown */}
            <h3 className="font-medium mb-4">Offer-wise Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Offer</th>
                    <th className="text-left py-3 px-2">Strategy</th>
                    <th className="text-center py-3 px-2">Views</th>
                    <th className="text-center py-3 px-2">Bookings</th>
                    <th className="text-center py-3 px-2">Conv. Rate</th>
                    <th className="text-right py-3 px-2">Revenue</th>
                    <th className="text-center py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o) => {
                    const views = o.views_count || 0;
                    const bookings = o.usage_count || 0;
                    const convRate = views > 0 ? ((bookings / views) * 100).toFixed(1) : '0';
                    
                    return (
                      <tr key={o.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <p className="font-medium">{o.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {o.discount_type === 'percentage' ? `${o.discount_value}%` : `₹${o.discount_value}`} off
                          </p>
                        </td>
                        <td className="py-3 px-2">{getStrategyLabel(o.revenue_strategy)}</td>
                        <td className="py-3 px-2 text-center">{views}</td>
                        <td className="py-3 px-2 text-center">{bookings}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            parseFloat(convRate) >= 10 ? 'bg-emerald-100 text-emerald-700' :
                            parseFloat(convRate) >= 5 ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {convRate}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">₹{(o.revenue_from_offer || 0).toLocaleString()}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`status-badge ${o.is_active ? 'status-available' : 'status-blocked'}`}>
                            {o.is_active ? 'Active' : 'Off'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {offers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No offer data yet. Create your first offer to start tracking performance!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <OfferDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        offer={editingOffer}
        onSuccess={fetchOffers}
      />

      <DetailDialog
        open={!!selectedOffer}
        onOpenChange={(open) => !open && setSelectedOffer(null)}
        title="Offer Details"
        data={selectedOffer ? {
          'Name': selectedOffer.name,
          'Description': selectedOffer.description || '-',
          'Discount': selectedOffer.discount_type === 'percentage' 
            ? `${selectedOffer.discount_value}%` 
            : `₹${selectedOffer.discount_value}`,
          'Strategy': getStrategyLabel(selectedOffer.revenue_strategy),
          'Time Decay': selectedOffer.time_decay_enabled ? 'Enabled' : 'Disabled',
          'Valid From': format(new Date(selectedOffer.valid_from), 'MMM d, yyyy'),
          'Valid Until': format(new Date(selectedOffer.valid_until), 'MMM d, yyyy'),
          'Applicable Days': selectedOffer.applicable_days?.join(', ') || 'All days',
          'Views': (selectedOffer.views_count || 0).toString(),
          'Bookings': (selectedOffer.usage_count || 0).toString(),
          'Revenue': `₹${selectedOffer.revenue_from_offer || 0}`,
          'Status': selectedOffer.is_active ? 'Active' : 'Inactive',
        } : {}}
        onEdit={() => selectedOffer && handleEdit(selectedOffer)}
        onDelete={() => selectedOffer && handleDelete(selectedOffer.id)}
      />
    </div>
  );
}