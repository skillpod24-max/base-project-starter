import { useState, useEffect } from 'react';
import { Power, Settings, Zap, Users, Clock, Trophy, Eye, MessageCircle, Percent, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TurfEngine {
  id?: string;
  turf_id: string;
  user_id: string;
  scarcity_enabled: boolean;
  scarcity_threshold: number;
  scarcity_message: string;
  social_proof_enabled: boolean;
  social_proof_time_window: string;
  social_proof_message: string;
  urgency_enabled: boolean;
  urgency_countdown_enabled: boolean;
  urgency_flash_offers_enabled: boolean;
  urgency_time_decay_enabled: boolean;
  urgency_decay_percentage: number;
  loyalty_enabled: boolean;
  loyalty_points_per_100: number;
  loyalty_show_progress: boolean;
  loyalty_milestone_rewards: boolean;
  fomo_enabled: boolean;
  fomo_show_live_viewers: boolean;
  fomo_show_recent_bookings: boolean;
  scratch_card_enabled: boolean;
  scratch_card_delay_seconds: number;
}

interface TurfEnginesPanelProps {
  turfId: string;
  userId: string;
}

const defaultEngine: Omit<TurfEngine, 'turf_id' | 'user_id'> = {
  scarcity_enabled: true,
  scarcity_threshold: 3,
  scarcity_message: 'Only {count} slots left!',
  social_proof_enabled: true,
  social_proof_time_window: 'week',
  social_proof_message: '{count} people booked this week',
  urgency_enabled: true,
  urgency_countdown_enabled: true,
  urgency_flash_offers_enabled: false,
  urgency_time_decay_enabled: false,
  urgency_decay_percentage: 10,
  loyalty_enabled: true,
  loyalty_points_per_100: 10,
  loyalty_show_progress: true,
  loyalty_milestone_rewards: true,
  fomo_enabled: true,
  fomo_show_live_viewers: true,
  fomo_show_recent_bookings: true,
  scratch_card_enabled: true,
  scratch_card_delay_seconds: 10,
};

export function TurfEnginesPanel({ turfId, userId }: TurfEnginesPanelProps) {
  const { toast } = useToast();
  const [engine, setEngine] = useState<TurfEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEngine();
  }, [turfId]);

  const fetchEngine = async () => {
    const { data } = await supabase
      .from('turf_engines')
      .select('*')
      .eq('turf_id', turfId)
      .maybeSingle();
    
    if (data) {
      setEngine(data as TurfEngine);
    } else {
      // Create default engine settings
      setEngine({
        turf_id: turfId,
        user_id: userId,
        ...defaultEngine,
      });
    }
    setLoading(false);
  };

  const saveEngine = async () => {
    if (!engine) return;
    setSaving(true);

    const { error } = engine.id
      ? await supabase
          .from('turf_engines')
          .update(engine)
          .eq('id', engine.id)
      : await supabase
          .from('turf_engines')
          .insert(engine);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: 'Conversion engine settings updated' });
      fetchEngine();
    }
    setSaving(false);
  };

  const updateField = <K extends keyof TurfEngine>(key: K, value: TurfEngine[K]) => {
    if (engine) {
      setEngine({ ...engine, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!engine) return null;

  return (
    <div className="space-y-6">
      {/* Scarcity Engine */}
      <div className={cn(
        "bg-card border rounded-xl p-5 transition-all",
        engine.scarcity_enabled ? "border-primary/30" : "border-border opacity-70"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              engine.scarcity_enabled ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
            )}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Scarcity Engine</h3>
              <p className="text-sm text-muted-foreground">Shows "Only X slots left" to create urgency</p>
            </div>
          </div>
          <Switch
            checked={engine.scarcity_enabled}
            onCheckedChange={(v) => updateField('scarcity_enabled', v)}
          />
        </div>
        
        {engine.scarcity_enabled && (
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label>Threshold (show when slots ≤)</Label>
              <Input
                type="number"
                value={engine.scarcity_threshold}
                onChange={(e) => updateField('scarcity_threshold', parseInt(e.target.value) || 3)}
                min={1}
                max={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Input
                value={engine.scarcity_message}
                onChange={(e) => updateField('scarcity_message', e.target.value)}
                placeholder="Only {count} slots left!"
              />
            </div>
          </div>
        )}
      </div>

      {/* Social Proof Engine */}
      <div className={cn(
        "bg-card border rounded-xl p-5 transition-all",
        engine.social_proof_enabled ? "border-primary/30" : "border-border opacity-70"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              engine.social_proof_enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Social Proof Engine</h3>
              <p className="text-sm text-muted-foreground">Displays booking activity to build trust</p>
            </div>
          </div>
          <Switch
            checked={engine.social_proof_enabled}
            onCheckedChange={(v) => updateField('social_proof_enabled', v)}
          />
        </div>
        
        {engine.social_proof_enabled && (
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label>Time Window</Label>
              <Select
                value={engine.social_proof_time_window}
                onValueChange={(v) => updateField('social_proof_time_window', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Input
                value={engine.social_proof_message}
                onChange={(e) => updateField('social_proof_message', e.target.value)}
                placeholder="{count} people booked this week"
              />
            </div>
          </div>
        )}
      </div>

      {/* Urgency Engine */}
      <div className={cn(
        "bg-card border rounded-xl p-5 transition-all",
        engine.urgency_enabled ? "border-primary/30" : "border-border opacity-70"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              engine.urgency_enabled ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
            )}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Urgency Engine</h3>
              <p className="text-sm text-muted-foreground">Time-decay discounts and countdown timers</p>
            </div>
          </div>
          <Switch
            checked={engine.urgency_enabled}
            onCheckedChange={(v) => updateField('urgency_enabled', v)}
          />
        </div>
        
        {engine.urgency_enabled && (
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Label>Show Countdown Timer</Label>
              <Switch
                checked={engine.urgency_countdown_enabled}
                onCheckedChange={(v) => updateField('urgency_countdown_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enable Flash Offers</Label>
              <Switch
                checked={engine.urgency_flash_offers_enabled}
                onCheckedChange={(v) => updateField('urgency_flash_offers_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Time Decay Pricing</Label>
              <Switch
                checked={engine.urgency_time_decay_enabled}
                onCheckedChange={(v) => updateField('urgency_time_decay_enabled', v)}
              />
            </div>
            {engine.urgency_time_decay_enabled && (
              <div className="space-y-2">
                <Label>Decay Percentage (%)</Label>
                <Input
                  type="number"
                  value={engine.urgency_decay_percentage}
                  onChange={(e) => updateField('urgency_decay_percentage', parseInt(e.target.value) || 10)}
                  min={5}
                  max={50}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loyalty Engine */}
      <div className={cn(
        "bg-card border rounded-xl p-5 transition-all",
        engine.loyalty_enabled ? "border-primary/30" : "border-border opacity-70"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              engine.loyalty_enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            )}>
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Loyalty Engine</h3>
              <p className="text-sm text-muted-foreground">Reward points and milestone bonuses</p>
            </div>
          </div>
          <Switch
            checked={engine.loyalty_enabled}
            onCheckedChange={(v) => updateField('loyalty_enabled', v)}
          />
        </div>
        
        {engine.loyalty_enabled && (
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label>Points per ₹100 spent</Label>
              <Input
                type="number"
                value={engine.loyalty_points_per_100}
                onChange={(e) => updateField('loyalty_points_per_100', parseInt(e.target.value) || 10)}
                min={1}
                max={50}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Progress Bar</Label>
              <Switch
                checked={engine.loyalty_show_progress}
                onCheckedChange={(v) => updateField('loyalty_show_progress', v)}
              />
            </div>
            <div className="flex items-center justify-between col-span-2">
              <Label>Enable Milestone Rewards</Label>
              <Switch
                checked={engine.loyalty_milestone_rewards}
                onCheckedChange={(v) => updateField('loyalty_milestone_rewards', v)}
              />
            </div>
          </div>
        )}
      </div>

      {/* FOMO Engine */}
      <div className={cn(
        "bg-card border rounded-xl p-5 transition-all",
        engine.fomo_enabled ? "border-primary/30" : "border-border opacity-70"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
          <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              engine.fomo_enabled ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">FOMO Engine</h3>
              <p className="text-sm text-muted-foreground">Live activity indicators for social proof</p>
            </div>
          </div>
          <Switch
            checked={engine.fomo_enabled}
            onCheckedChange={(v) => updateField('fomo_enabled', v)}
          />
        </div>
        
        {engine.fomo_enabled && (
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Label>Show Live Viewers</Label>
              <Switch
                checked={engine.fomo_show_live_viewers}
                onCheckedChange={(v) => updateField('fomo_show_live_viewers', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Recent Bookings</Label>
              <Switch
                checked={engine.fomo_show_recent_bookings}
                onCheckedChange={(v) => updateField('fomo_show_recent_bookings', v)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scratch Card Engine */}
      <div className={cn(
        "bg-card border rounded-xl p-5 transition-all",
        engine.scratch_card_enabled ? "border-primary/30" : "border-border opacity-70"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              engine.scratch_card_enabled ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
            )}>
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Scratch Card Offers</h3>
              <p className="text-sm text-muted-foreground">Gamified offer reveal to boost engagement</p>
            </div>
          </div>
          <Switch
            checked={engine.scratch_card_enabled}
            onCheckedChange={(v) => updateField('scratch_card_enabled', v)}
          />
        </div>
        
        {engine.scratch_card_enabled && (
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label>Show After (seconds)</Label>
              <Input
                type="number"
                value={engine.scratch_card_delay_seconds}
                onChange={(e) => updateField('scratch_card_delay_seconds', parseInt(e.target.value) || 10)}
                min={5}
                max={60}
              />
              <p className="text-xs text-muted-foreground">Time before popup appears (5-60s)</p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button 
        onClick={saveEngine} 
        disabled={saving}
        className="w-full"
        size="lg"
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Engine Settings
          </>
        )}
      </Button>
    </div>
  );
}
