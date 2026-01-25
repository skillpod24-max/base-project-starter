import { useState, useEffect } from 'react';
import { FlaskConical, Plus, Trash2, TrendingUp, Users, Target, Save, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ABTestVariant {
  id?: string;
  turf_id: string;
  user_id: string;
  variant_name: string;
  variant_type: string;
  variant_value: any;
  traffic_percentage: number;
  is_active: boolean;
}

interface ABTestMetric {
  variant_id: string;
  metric_date: string;
  impressions: number;
  conversions: number;
}

interface ABTestingPanelProps {
  turfId: string;
  userId: string;
}

const VARIANT_TYPES = [
  { value: 'scratch_card_delay', label: 'Scratch Card Delay', unit: 'seconds' },
  { value: 'scarcity_threshold', label: 'Scarcity Threshold', unit: 'slots' },
  { value: 'social_proof_window', label: 'Social Proof Window', unit: '' },
];

export function ABTestingPanel({ turfId, userId }: ABTestingPanelProps) {
  const { toast } = useToast();
  const [variants, setVariants] = useState<ABTestVariant[]>([]);
  const [metrics, setMetrics] = useState<Record<string, ABTestMetric[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewVariant, setShowNewVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({
    variant_name: '',
    variant_type: 'scratch_card_delay',
    variant_value: 10,
    traffic_percentage: 50,
  });

  useEffect(() => {
    fetchVariants();
  }, [turfId]);

  const fetchVariants = async () => {
    const { data: variantsData } = await supabase
      .from('ab_test_variants')
      .select('*')
      .eq('turf_id', turfId)
      .order('created_at', { ascending: false });

    if (variantsData) {
      setVariants(variantsData as ABTestVariant[]);
      
      // Fetch metrics for each variant
      const metricsMap: Record<string, ABTestMetric[]> = {};
      for (const variant of variantsData) {
        const { data: metricsData } = await supabase
          .from('ab_test_metrics')
          .select('*')
          .eq('variant_id', variant.id)
          .order('metric_date', { ascending: false })
          .limit(7);
        
        if (metricsData) {
          metricsMap[variant.id] = metricsData as ABTestMetric[];
        }
      }
      setMetrics(metricsMap);
    }
    setLoading(false);
  };

  const createVariant = async () => {
    if (!newVariant.variant_name) {
      toast({ title: 'Error', description: 'Please enter a variant name', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('ab_test_variants')
      .insert({
        turf_id: turfId,
        user_id: userId,
        variant_name: newVariant.variant_name,
        variant_type: newVariant.variant_type,
        variant_value: { value: newVariant.variant_value },
        traffic_percentage: newVariant.traffic_percentage,
        is_active: true,
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Created!', description: 'A/B test variant created successfully' });
      setShowNewVariant(false);
      setNewVariant({
        variant_name: '',
        variant_type: 'scratch_card_delay',
        variant_value: 10,
        traffic_percentage: 50,
      });
      fetchVariants();
    }
    setSaving(false);
  };

  const toggleVariant = async (variant: ABTestVariant) => {
    const { error } = await supabase
      .from('ab_test_variants')
      .update({ is_active: !variant.is_active })
      .eq('id', variant.id);

    if (!error) {
      fetchVariants();
    }
  };

  const deleteVariant = async (variantId: string) => {
    const { error } = await supabase
      .from('ab_test_variants')
      .delete()
      .eq('id', variantId);

    if (!error) {
      toast({ title: 'Deleted', description: 'Variant removed' });
      fetchVariants();
    }
  };

  const getConversionRate = (variantId: string) => {
    const variantMetrics = metrics[variantId] || [];
    const totalImpressions = variantMetrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalConversions = variantMetrics.reduce((sum, m) => sum + m.conversions, 0);
    return totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(1) : '0.0';
  };

  const getTotalImpressions = (variantId: string) => {
    const variantMetrics = metrics[variantId] || [];
    return variantMetrics.reduce((sum, m) => sum + m.impressions, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold">A/B Testing</h3>
            <p className="text-sm text-muted-foreground">Test conversion engine settings to optimize bookings</p>
          </div>
        </div>
        <Button onClick={() => setShowNewVariant(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Test
        </Button>
      </div>

      {/* New Variant Form */}
      {showNewVariant && (
        <div className="bg-violet-50 border-2 border-violet-200 rounded-xl p-4 space-y-4">
          <h4 className="font-medium text-violet-900">Create New A/B Test</h4>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Name</Label>
              <Input
                placeholder="e.g., Faster scratch card"
                value={newVariant.variant_name}
                onChange={(e) => setNewVariant(prev => ({ ...prev, variant_name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Setting to Test</Label>
              <Select
                value={newVariant.variant_type}
                onValueChange={(v) => setNewVariant(prev => ({ ...prev, variant_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VARIANT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>
                Value ({VARIANT_TYPES.find(t => t.value === newVariant.variant_type)?.unit || ''})
              </Label>
              {newVariant.variant_type === 'social_proof_window' ? (
                <Select
                  value={String(newVariant.variant_value)}
                  onValueChange={(v) => setNewVariant(prev => ({ ...prev, variant_value: v }))}
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
              ) : (
                <Input
                  type="number"
                  value={newVariant.variant_value}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, variant_value: parseInt(e.target.value) || 0 }))}
                />
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Traffic Split (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={newVariant.traffic_percentage}
                onChange={(e) => setNewVariant(prev => ({ ...prev, traffic_percentage: parseInt(e.target.value) || 50 }))}
              />
              <p className="text-xs text-muted-foreground">% of visitors who see this variant</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={createVariant} disabled={saving} className="gap-2">
              {saving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Create Test
            </Button>
            <Button variant="outline" onClick={() => setShowNewVariant(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Existing Variants */}
      {variants.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-xl">
          <FlaskConical className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No A/B tests yet</p>
          <p className="text-sm text-muted-foreground">Create your first test to start optimizing conversions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map(variant => (
            <div 
              key={variant.id}
              className={cn(
                "bg-card border rounded-xl p-4 transition-all",
                variant.is_active ? "border-violet-300 ring-2 ring-violet-100" : "border-border opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    variant.is_active ? "bg-violet-100 text-violet-600" : "bg-muted text-muted-foreground"
                  )}>
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{variant.variant_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {VARIANT_TYPES.find(t => t.value === variant.variant_type)?.label}: {' '}
                      <span className="font-medium text-foreground">
                        {(variant.variant_value as any)?.value}
                        {VARIANT_TYPES.find(t => t.value === variant.variant_type)?.unit && 
                          ` ${VARIANT_TYPES.find(t => t.value === variant.variant_type)?.unit}`}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleVariant(variant)}
                    className={cn(
                      variant.is_active ? "text-violet-600" : "text-muted-foreground"
                    )}
                  >
                    {variant.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteVariant(variant.id!)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Users className="w-3 h-3" />
                    <span className="text-xs">Traffic</span>
                  </div>
                  <p className="font-bold text-lg">{variant.traffic_percentage}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Target className="w-3 h-3" />
                    <span className="text-xs">Impressions</span>
                  </div>
                  <p className="font-bold text-lg">{getTotalImpressions(variant.id!)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs">Conversion</span>
                  </div>
                  <p className={cn(
                    "font-bold text-lg",
                    parseFloat(getConversionRate(variant.id!)) >= 5 ? "text-success" : ""
                  )}>
                    {getConversionRate(variant.id!)}%
                  </p>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={cn(
                  "px-2 py-1 rounded-full font-medium",
                  variant.is_active ? "bg-violet-100 text-violet-700" : "bg-muted text-muted-foreground"
                )}>
                  {variant.is_active ? 'Running' : 'Paused'}
                </span>
                <span className="text-muted-foreground">
                  Last 7 days metrics
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
