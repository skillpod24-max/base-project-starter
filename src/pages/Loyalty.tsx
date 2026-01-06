import { useState, useEffect } from 'react';
import { Plus, Gift, Award, Users, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  reward_value: number;
  is_active: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  loyalty_points: number;
  loyalty_tier: string;
  total_bookings: number;
  total_spent: number;
}

interface Transaction {
  id: string;
  customer_id: string;
  points: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
  customers?: { name: string };
}

export default function Loyalty() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points_required: '',
    reward_type: 'discount',
    reward_value: '',
  });

  useEffect(() => {
    if (user) {
      fetchRewards();
      fetchCustomers();
      fetchTransactions();
    }
  }, [user]);

  const fetchRewards = async () => {
    if (!user) return;
    const { data } = await supabase.from('loyalty_rewards').select('*').eq('user_id', user.id).order('points_required');
    setRewards(data || []);
  };

  const fetchCustomers = async () => {
    if (!user) return;
    const { data } = await supabase.from('customers').select('*').eq('user_id', user.id).order('loyalty_points', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('loyalty_transactions')
      .select('*, customers(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setTransactions(data || []);
  };

  const handleSaveReward = async () => {
    if (!user || !rewardForm.name || !rewardForm.points_required || !rewardForm.reward_value) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const rewardData = {
      user_id: user.id,
      name: rewardForm.name,
      description: rewardForm.description || null,
      points_required: parseInt(rewardForm.points_required),
      reward_type: rewardForm.reward_type,
      reward_value: parseFloat(rewardForm.reward_value),
    };

    if (selectedReward) {
      await supabase.from('loyalty_rewards').update(rewardData).eq('id', selectedReward.id);
      toast({ title: 'Reward updated' });
    } else {
      await supabase.from('loyalty_rewards').insert(rewardData);
      toast({ title: 'Reward created' });
    }

    setRewardDialogOpen(false);
    setSelectedReward(null);
    setRewardForm({ name: '', description: '', points_required: '', reward_type: 'discount', reward_value: '' });
    fetchRewards();
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Delete this reward?')) return;
    await supabase.from('loyalty_rewards').delete().eq('id', id);
    toast({ title: 'Reward deleted' });
    fetchRewards();
  };

  const handleToggleReward = async (id: string, isActive: boolean) => {
    await supabase.from('loyalty_rewards').update({ is_active: !isActive }).eq('id', id);
    fetchRewards();
  };

  const handleAddPoints = async () => {
    if (!user || !selectedCustomer || !pointsToAdd) return;

    const points = parseInt(pointsToAdd);
    
    // Add transaction
    await supabase.from('loyalty_transactions').insert({
      user_id: user.id,
      customer_id: selectedCustomer,
      points: points,
      transaction_type: points > 0 ? 'earned' : 'redeemed',
      description: pointsReason || (points > 0 ? 'Manual points added' : 'Points redeemed'),
    });

    // Update customer points
    const customer = customers.find(c => c.id === selectedCustomer);
    if (customer) {
      const newPoints = (customer.loyalty_points || 0) + points;
      const newTier = newPoints >= 1000 ? 'gold' : newPoints >= 500 ? 'silver' : 'bronze';
      await supabase.from('customers').update({ 
        loyalty_points: Math.max(0, newPoints),
        loyalty_tier: newTier 
      }).eq('id', selectedCustomer);
    }

    toast({ title: points > 0 ? 'Points added' : 'Points redeemed' });
    setPointsDialogOpen(false);
    setSelectedCustomer('');
    setPointsToAdd('');
    setPointsReason('');
    fetchCustomers();
    fetchTransactions();
  };

  const openEditReward = (reward: LoyaltyReward) => {
    setSelectedReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description || '',
      points_required: reward.points_required.toString(),
      reward_type: reward.reward_type,
      reward_value: reward.reward_value.toString(),
    });
    setRewardDialogOpen(true);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500';
      case 'silver': return 'bg-gray-400/20 text-gray-600 border-gray-400';
      default: return 'bg-orange-500/20 text-orange-600 border-orange-500';
    }
  };

  const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);
  const goldMembers = customers.filter(c => c.loyalty_tier === 'gold').length;
  const silverMembers = customers.filter(c => c.loyalty_tier === 'silver').length;

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
        <h1>Loyalty Program</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPointsDialogOpen(true)}>
            <Award className="w-4 h-4 mr-2" /> Add Points
          </Button>
          <Button onClick={() => { setSelectedReward(null); setRewardForm({ name: '', description: '', points_required: '', reward_type: 'discount', reward_value: '' }); setRewardDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Reward
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gold Members</p>
              <p className="text-2xl font-bold">{goldMembers}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-400/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Silver Members</p>
              <p className="text-2xl font-bold">{silverMembers}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Rewards</p>
              <p className="text-2xl font-bold">{rewards.filter(r => r.is_active).length}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <div className="bg-card border rounded-lg overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Points</th>
                  <th>Tier</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No customers yet</td></tr>
                ) : customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.phone}</td>
                    <td className="font-semibold text-primary">{c.loyalty_points || 0}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(c.loyalty_tier || 'bronze')}`}>
                        {(c.loyalty_tier || 'bronze').toUpperCase()}
                      </span>
                    </td>
                    <td>₹{c.total_spent || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No rewards configured. Create your first reward!
              </div>
            ) : rewards.map((reward) => (
              <div key={reward.id} className={`bg-card border rounded-lg p-4 ${!reward.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">{reward.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={reward.is_active} onCheckedChange={() => handleToggleReward(reward.id, reward.is_active)} />
                    <Button variant="ghost" size="icon" onClick={() => openEditReward(reward)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteReward(reward.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {reward.description && <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="bg-primary/10 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-primary">{reward.points_required} pts</span>
                  </div>
                  <div className="text-sm">
                    {reward.reward_type === 'discount' && `${reward.reward_value}% off`}
                    {reward.reward_type === 'fixed' && `₹${reward.reward_value} off`}
                    {reward.reward_type === 'free_hour' && `${reward.reward_value}h free`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="bg-card border rounded-lg overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Points</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No transactions yet</td></tr>
                ) : transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{format(new Date(t.created_at), 'MMM d, yyyy')}</td>
                    <td className="font-medium">{t.customers?.name || '-'}</td>
                    <td>
                      <span className={`status-badge ${t.transaction_type === 'earned' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className={`font-semibold ${t.points > 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.points > 0 ? '+' : ''}{t.points}
                    </td>
                    <td className="text-muted-foreground">{t.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Reward Dialog */}
      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedReward ? 'Edit Reward' : 'Add Reward'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reward Name *</Label>
              <Input value={rewardForm.name} onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })} placeholder="e.g., Free Hour" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} placeholder="e.g., Get 1 hour free booking" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points Required *</Label>
                <Input type="number" value={rewardForm.points_required} onChange={(e) => setRewardForm({ ...rewardForm, points_required: e.target.value })} placeholder="500" />
              </div>
              <div className="space-y-2">
                <Label>Reward Type *</Label>
                <Select value={rewardForm.reward_type} onValueChange={(v) => setRewardForm({ ...rewardForm, reward_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Percentage Discount</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="free_hour">Free Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reward Value *</Label>
              <Input type="number" value={rewardForm.reward_value} onChange={(e) => setRewardForm({ ...rewardForm, reward_value: e.target.value })} placeholder={rewardForm.reward_type === 'discount' ? '10 (%)' : rewardForm.reward_type === 'fixed' ? '100 (₹)' : '1 (hour)'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveReward}>{selectedReward ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Points Dialog */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add/Redeem Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.loyalty_points || 0} pts)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Points *</Label>
              <Input type="number" value={pointsToAdd} onChange={(e) => setPointsToAdd(e.target.value)} placeholder="Use negative for redemption (e.g., -100)" />
              <p className="text-xs text-muted-foreground">Use positive numbers to add, negative to redeem</p>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={pointsReason} onChange={(e) => setPointsReason(e.target.value)} placeholder="e.g., Bonus points, Reward redemption" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPointsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPoints}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
